import { createHttpApiVirtualModulePlugin } from "@typed/app/HttpApiVirtualModulePlugin";
import {
  APP_TYPE_TARGET_BOOTSTRAP_CONTENT,
  createTypeInfoApiSessionForApp,
} from "@typed/app/createTypeInfoApiSessionForApp";
import { Effect } from "effect";
import { HttpServerResponse } from "effect/unstable/http";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as ArticleCreate from "../../api/articles/create.js";
import * as ArticleDelete from "../../api/articles/delete.js";
import * as TagsList from "../../api/tags/list.js";
import * as UserCurrent from "../../api/user/current.js";
import * as UsersRegister from "../../api/users/register.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { email, password, tagName, username } from "../helpers/domain.js";
import {
  ApplicationTestLayer,
  defaultDataDirectory,
  runWithLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "api-test.sqlite");
const testGeneratedDir = resolve(defaultDataDirectory, "api-generated-test");
const TestLayer = ApplicationTestLayer({ databasePath: testDatabasePath });

const expectedModuleNames = [
  "ArticlesCreate",
  "ArticlesDelete",
  "ArticlesFavorite",
  "ArticlesFeed",
  "ArticlesGet",
  "ArticlesList",
  "ArticlesUnfavorite",
  "ArticlesUpdate",
  "ArticlesCommentsCreate",
  "ArticlesCommentsDelete",
  "ArticlesCommentsList",
  "ProfilesFollow",
  "ProfilesGet",
  "ProfilesUnfollow",
  "TagsList",
  "UserCurrent",
  "UserUpdate",
  "UsersLogin",
  "UsersRegister",
] as const;

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  runWithLayer(effect, TestLayer);

const json = async <A>(response: Response): Promise<A> => response.json();

const responseFrom = async <E, R>(
  effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
): Promise<Response> => HttpServerResponse.toWeb(await run(effect));

describe("realworld generated api source", () => {
  it("discovers every endpoint and exposes OpenAPI JSON without docs UI paths", () => {
    const source = buildGeneratedApiSource();

    for (const name of expectedModuleNames) {
      expect(source).toContain(`import * as ${name}`);
    }

    expect(source).toContain('openapiPath: "/api/docs/openapi.json"');
    expect(source).toContain('import * as ArticlesPrefix from "./api/articles/_prefix.js";');
    expect(source).toContain(
      'import * as ArticlesCommentsPrefix from "./api/articles/comments/_prefix.js";',
    );
    expect(source).toContain("const ArticlesRoute = Route.Join(ApiRoute, ArticlesPrefix.default);");
    expect(source).toContain(
      "const ArticlesCommentsRoute = Route.Join(ArticlesRoute, ArticlesCommentsPrefix.default);",
    );
    expect(source).toContain(
      "params: ArticlesCommentsDeleteRoute.pathSchema",
    );
    expect(source).toContain("query: ArticlesCommentsDeleteRoute.querySchema");
    expect(source).not.toContain("/api/docs/swagger");
    expect(source).not.toContain('path: "/api/docs"');
  });
});

describe("realworld API endpoint handlers", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
    rmSync(testGeneratedDir, { recursive: true, force: true });
  });

  it("registers a user, creates an article, and lists tags", async () => {
    const registered = await responseFrom(UsersRegister.handler({
      body: {
        user: {
          username: username("api_user"),
          email: email("api.user@example.com"),
          password: password("password123"),
        },
      },
    }));
    const user = await json<{ user: { readonly token: string; readonly username: string } }>(
      registered,
    );

    expect(registered.status).toBe(201);
    expect(user.user.username).toBe("api_user");

    const article = await responseFrom(ArticleCreate.handler({
      headers: { authorization: `Token ${user.user.token}` },
      body: {
        article: {
          title: "API Article",
          description: "created through HTTP",
          body: "API body",
          tagList: [tagName("api"), tagName("typed")],
        },
      },
    }));
    const articleBody = await json<{ article: { readonly slug: string } }>(article);

    expect(article.status).toBe(201);
    expect(articleBody.article.slug).toBe("api-article");

    const tags = await responseFrom(TagsList.handler({}));
    expect(tags.status).toBe(200);
    expect(await json(tags)).toMatchObject({ tags: expect.arrayContaining(["typed"]) });
  });

  it("returns RealWorld error envelopes and no body for delete success", async () => {
    const missing = await responseFrom(UserCurrent.handler({}));
    expect(missing.status).toBe(401);
    expect(await json(missing)).toEqual({ errors: { token: ["is missing"] } });

    const registered = await responseFrom(UsersRegister.handler({
      body: {
        user: {
          username: username("delete_user"),
          email: email("delete.user@example.com"),
          password: password("password123"),
        },
      },
    }));
    const user = await json<{ user: { readonly token: string } }>(registered);
    const created = await responseFrom(ArticleCreate.handler({
      headers: { authorization: `Token ${user.user.token}` },
      body: {
        article: { title: "Delete Me", description: "x", body: "x" },
      },
    }));
    const article = await json<{ article: { readonly slug: string } }>(created);
    const deleted = await responseFrom(ArticleDelete.handler({
      headers: { authorization: `Token ${user.user.token}` },
      path: { slug: article.article.slug },
    }));

    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");
  });
});

function buildGeneratedApiSource(): string {
  mkdirSync(testGeneratedDir, { recursive: true });
  const bootstrap = join(testGeneratedDir, "type-target-bootstrap.ts");
  writeFileSync(bootstrap, APP_TYPE_TARGET_BOOTSTRAP_CONTENT, "utf8");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const files = [...findTsFiles(join(root, "src/api")), bootstrap];
  const program = ts.createProgram(files, {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  });
  const session = createTypeInfoApiSessionForApp({ ts, program });
  const result = createHttpApiVirtualModulePlugin().build(
    "typed:api?dir=./api",
    join(root, "src/server.ts"),
    session.api,
  );
  if (typeof result === "string") return result;
  if ("sourceText" in result && result.sourceText) return result.sourceText;
  throw new Error(JSON.stringify(result));
}

function findTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findTsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}
