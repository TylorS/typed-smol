import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import * as Effect from "effect/Effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { template as settingsTemplate } from "../../routes/settings.js";
import { renderUrl } from "../../server.js";
import { defaultDataDirectory, makeLayerRunner, ServerPageTestLayer } from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "ssr-test.sqlite");
const TestLayer = ServerPageTestLayer({ databasePath: testDatabasePath });

const run = makeLayerRunner(TestLayer);

const render = (url: string): Promise<string> => run(renderUrl(url));

describe("realworld SSR pages", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("renders the global feed with seeded articles, tags, and pagination", async () => {
    const html = await render("/");

    expect(html).toContain("Global Feed");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("seed_author");
    expect(html).toContain("typed");
    expect(html).toContain('class="page-item active"');
  });

  it("renders page two with the next seeded articles", async () => {
    const html = await render("/?page=2");

    expect(html).toContain("Seeded Typed RealWorld 11");
    expect(html).not.toContain(">Seeded Typed RealWorld 1<");
    expect(html).toContain('aria-current="page">2</a>');
  });

  it("renders a tag feed with selected tag evidence", async () => {
    const html = await render("/tag/ssr");

    expect(html).toContain("ssr");
    expect(html).toContain("Seeded Typed RealWorld 5");
    expect(html).not.toContain(">Seeded Typed RealWorld 1<");
  });

  it("renders an article page with full body, metadata, controls, and comments", async () => {
    const html = await render("/article/seeded-typed-realworld-1");

    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("This is deterministic seed article 1.");
    expect(html).toContain("Favorite Article");
    expect(html).toContain("Follow seed_author");
    expect(html).toContain("This seed article proves comments are real.");
  });

  it("renders an author profile with authored articles", async () => {
    const html = await render("/profile/seed_author");

    expect(html).toContain("seed_author");
    expect(html).toContain("Writes about Typed and Effect.");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).toContain("My Articles");
  });

  it("renders a favorited profile tab with favorited articles only", async () => {
    const html = await render("/profile/seed_reader/favorites");

    expect(html).toContain("seed_reader");
    expect(html).toContain("Favorited Articles");
    expect(html).toContain("Seeded Typed RealWorld 1");
    expect(html).not.toContain("Seeded Typed RealWorld 2");
  });

  it("renders login form with RealWorld field contracts", async () => {
    const login = await render("/login");

    expect(login).toContain('class="auth-page"');
    expect(login).toContain('name="email"');
    expect(login).toContain('name="password"');
  });

  it("renders register form with RealWorld field contracts", async () => {
    const register = await render("/register");

    expect(register).toContain('class="auth-page"');
    expect(register).toContain('name="username"');
    expect(register).toContain("Have an account?");
  });

  it("renders settings form with RealWorld field contracts", async () => {
    const settings = await render("/settings");

    expect(settings).toContain('class="settings-page"');
    expect(settings).toContain('name="image"');
    expect(settings).toContain("Or click here to logout.");
  });

  it("renders settings route template directly as static html", async () => {
    const settings = await Effect.runPromise(
      renderToHtmlString(settingsTemplate).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
        Effect.scoped,
      ),
    );

    expect(settings).toContain('class="settings-page"');
    expect(settings).toContain("Or click here to logout.");
  });

  it("renders editor forms for create and edit routes", async () => {
    const create = await render("/editor");
    const edit = await render("/editor/seeded-typed-realworld-1");

    expect(create).toContain('class="editor-page"');
    expect(create).toContain('name="title"');
    expect(create).toContain('name="description"');
    expect(create).toContain('name="body"');
    expect(create).toContain('name="tagList"');
    expect(edit).toContain("Edit Article");
  });
});
