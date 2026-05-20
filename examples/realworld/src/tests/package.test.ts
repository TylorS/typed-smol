import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");

const readText = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

const readJson = <A>(path: string): A => JSON.parse(readText(path)) as A;

type PackageJson = {
  readonly name: string;
  readonly type: string;
  readonly scripts: Record<string, string>;
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
};

describe("typed-realworld package skeleton", () => {
  it("declares only the approved runtime and development dependencies", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(pkg.name).toBe("typed-realworld");
    expect(pkg.type).toBe("module");

    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      "@effect/sql-sqlite-node",
      "@typed/app",
      "@typed/async-data",
      "@typed/fx",
      "@typed/guard",
      "@typed/navigation",
      "@typed/router",
      "@typed/template",
      "@typed/ui",
      "effect",
      "micromark",
    ]);

    expect(Object.keys(pkg.devDependencies).sort()).toEqual([
      "@playwright/test",
      "@typed/cli",
      "@typed/tsconfig",
      "@typed/virtual-modules-compiler",
      "@typed/virtual-modules-ts-plugin",
      "@typed/vite-plugin",
      "@types/node",
      "typescript",
      "vite",
      "vitest",
    ]);
  });

  it("exposes every required local workflow script", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(pkg.scripts.build).toContain("vmc -p tsconfig.json");
    expect(pkg.scripts.typecheck).toBe("vmc --noEmit -p tsconfig.json");
    expect(pkg.scripts["db:migrate"]).toContain("vmc -p tsconfig.json");

    expect(Object.keys(pkg.scripts).sort()).toEqual([
      "build",
      "db:migrate",
      "db:reset",
      "db:seed",
      "dev",
      "preview",
      "test",
      "test:acceptance:local",
      "test:api:hurl:local",
      "test:e2e:local",
      "test:integration",
      "test:ssr",
      "test:unit",
      "typecheck",
    ]);
  });

  it("contains the required config, entry, ignore, and asset files", () => {
    expect(readText(".gitignore")).toContain(".data/");
    expect(readText(".gitignore")).toContain("playwright-report/");
    expect(readText(".gitignore")).toContain("test-results/");
    expect(readText(".gitignore")).toContain(".hurl/");

    expect(readText("vmc.config.ts")).toContain("createRouterVirtualModulePlugin");
    expect(readText("vmc.config.ts")).not.toContain("createRouteHandlersVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createHttpApiVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createConfigVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createHtmlVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createBrowserVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createServerVirtualModulePlugin");
    expect(readText("vmc.config.ts")).not.toContain('from "@typed/app";');
    expect(existsSync(resolve(projectRoot, "src/types/typed-virtual-modules.d.ts"))).toBe(false);
    expect(readText("vite.config.ts")).toContain("typedVitePlugin");
    expect(readText("typed.config.ts")).toContain("defineConfig");
    expect(readText("typed.config.ts")).not.toContain('from "@typed/app";');

    expect(existsSync(resolve(projectRoot, "index.html"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/main.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/server.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/browser.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/ssr.ts"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/browser-routes"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "public/default-avatar.svg"))).toBe(true);
  });

  it("uses the SSR outlet and explicitly configures the browser root", () => {
    const html = readText("index.html");
    const browserEntry = readText("src/browser.ts");

    expect(html).toContain('<div id="realworld-root"><!--typed-ssr-outlet--></div>');
    expect(html).not.toContain('<div id="app"></div>');
    expect(browserEntry).toContain('root: "#realworld-root"');
  });

  it("keeps route modules environment-agnostic with entrypoint-scoped dependencies", () => {
    expect(existsSync(resolve(projectRoot, "src/routes/_dependencies.ts"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/routes/_handlers.dependencies.ts"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/.server.dependencies.ts"))).toBe(true);

    expect(routeSourceFiles().filter((path) => path.includes(".handler."))).toEqual([]);

    for (const path of routeSourceFiles()) {
      expect(readText(path), path).not.toContain('from "@typed/app";');
      expect(readText(path), path).not.toContain("../presentation/App.js");
      expect(readText(path), path).not.toContain("switchMap");
    }
  });

  it("uses generated route type modules instead of RouteHandler wrappers", () => {
    for (const path of routeSourceFiles()) {
      const source = readText(path);

      expect(source, path).not.toContain("RouteHandler");
      expect(source, path).not.toContain("@typed/app/RouteHandler");
    }
  });

  it("keeps api endpoint helpers off the @typed/app package barrel", () => {
    for (const path of apiEndpointSourceFiles()) {
      expect(readText(path), path).not.toContain('from "@typed/app";');
    }
  });

  it("uses generated api type modules instead of ApiHandlerRaw wrappers", () => {
    for (const path of apiEndpointSourceFiles()) {
      const source = readText(path);

      expect(source, path).not.toContain("ApiHandlerRaw");
      expect(source, path).not.toContain("@typed/app/httpapi/ApiHandler");
    }
  });

  it("uses Effect.fn handlers checked with satisfies RawHandler", () => {
    for (const path of apiEndpointSourceFiles()) {
      const source = readText(path);

      expect(source, path).toContain("Effect.fn(");
      expect(source, path).toContain("satisfies RawHandler<");
      expect(source, path).not.toMatch(/export const handler\s*:/);
      expect(source, path).not.toContain("RawHandler<never,");
    }
  });

  it("uses the generated api virtual module instead of a hand-written client api", () => {
    expect(existsSync(resolve(projectRoot, "src/presentation/ClientApi.ts"))).toBe(false);

    expect(readText("src/Api.ts")).toContain('from "api:./api"');
    expect(readText("src/presentation/BrowserApiClient.ts")).toContain('from "../Api.js"');
    expect(readText("src/page-data/BrowserPageData.ts")).toContain('from "../Api.js"');
    expect(readText("src/presentation/State.ts")).toContain('from "../Api.js"');

    for (const path of productionSourceFiles()) {
      expect(readText(path), path).not.toContain("ClientApi");
      expect(readText(path), path).not.toContain("createRealWorldClient");
    }
  });

  it("does not use unknown as an Effect error channel in production source", () => {
    const offenders = productionSourceFiles()
      .flatMap((path) =>
        effectUnknownErrorChannelLines(path).map((line) => `${path}:${line}`));

    expect(offenders).toEqual([]);
  });

  it("uses Effect.gen for sequential browser state effects", () => {
    const offenders = genPreferredSourceFiles()
      .flatMap((path) =>
        effectCombinatorLines(path).map((line) => `${path}:${line}`));

    expect(offenders).toEqual([]);
  });

  it("models asynchronously loaded route data with RefAsyncData", () => {
    for (const path of asyncRouteSourceFiles()) {
      const source = readText(path);
      expect(source, path).toContain("RefAsyncData");
      expect(source, path).not.toContain("RefSubject.mapEffect");
    }

    for (const path of asyncPageSourceFiles()) {
      expect(readText(path), path).toContain("AsyncData");
    }
  });

  it("uses @typed/ui Link for internal navigation anchors", () => {
    const offenders = linkSourceFiles()
      .flatMap((path) =>
        rawAnchorHrefLines(path).map((line) => `${path}:${line}`));

    expect(offenders).toEqual([]);
  });

  it("provides SqlClient through layers instead of rebuilding sqlite per repository call", () => {
    const dependencyLayer = readText("src/.server.dependencies.ts");
    const offenders = repositorySourceFiles()
      .flatMap((path) =>
        readText(path).includes("runSql") ? [path] : []);

    expect(dependencyLayer).toContain("SqliteLive");
    expect(offenders).toEqual([]);
  });

  it("uses composed Layer test harnesses instead of stacked Effect.provide", () => {
    const offenders = layerHarnessSourceFiles()
      .flatMap((path) =>
        stackedProvideLines(path).map((line) => `${path}:${line}`));

    expect(offenders).toEqual([]);
  });
});

const productionSourceFiles = (): readonly string[] => [
  "src/api-support/Common.ts",
  "src/application/Articles.ts",
  "src/application/Comments.ts",
  "src/application/Profiles.ts",
  "src/application/Tags.ts",
  "src/application/Users.ts",
  "src/browser.ts",
  "src/page-data/BrowserPageData.ts",
  "src/page-data/PageData.ts",
  "src/presentation/BrowserAuth.ts",
  "src/presentation/FormEvents.ts",
  "src/presentation/State.ts",
];

const routeSourceFiles = (): readonly string[] => [
  "src/routes/article.ts",
  "src/routes/editor-slug.ts",
  "src/routes/editor.ts",
  "src/routes/index.ts",
  "src/routes/login.ts",
  "src/routes/profile-favorites.ts",
  "src/routes/profile.ts",
  "src/routes/register.ts",
  "src/routes/settings.ts",
  "src/routes/tag.ts",
];

const asyncRouteSourceFiles = (): readonly string[] => [
  "src/routes/article.ts",
  "src/routes/index.ts",
  "src/routes/profile-favorites.ts",
  "src/routes/profile.ts",
  "src/routes/tag.ts",
];

const asyncPageSourceFiles = (): readonly string[] => [
  "src/presentation/ArticlePage.ts",
  "src/presentation/Feed.ts",
  "src/presentation/ProfilePage.ts",
];

const apiEndpointSourceFiles = (): readonly string[] => [
  "src/api/articles/create.ts",
  "src/api/articles/delete.ts",
  "src/api/articles/favorite.ts",
  "src/api/articles/feed.ts",
  "src/api/articles/get.ts",
  "src/api/articles/list.ts",
  "src/api/articles/unfavorite.ts",
  "src/api/articles/update.ts",
  "src/api/comments/create.ts",
  "src/api/comments/delete.ts",
  "src/api/comments/list.ts",
  "src/api/profiles/follow.ts",
  "src/api/profiles/get.ts",
  "src/api/profiles/unfollow.ts",
  "src/api/tags/list.ts",
  "src/api/user/current.ts",
  "src/api/user/update.ts",
  "src/api/users/login.ts",
  "src/api/users/register.ts",
];

const repositorySourceFiles = (): readonly string[] => [
  "src/infrastructure/repositories/ArticleRepository.ts",
  "src/infrastructure/repositories/CommentRepository.ts",
  "src/infrastructure/repositories/ProfileRepository.ts",
  "src/infrastructure/repositories/TagRepository.ts",
  "src/infrastructure/repositories/UserRepository.ts",
  "src/infrastructure/SessionTokens.ts",
];

const layerHarnessSourceFiles = (): readonly string[] => [
  "src/tests/api/api.test.ts",
  "src/tests/application/articles.test.ts",
  "src/tests/application/social.test.ts",
  "src/tests/application/users.test.ts",
  "src/tests/infrastructure/articles.test.ts",
  "src/tests/infrastructure/comments.test.ts",
  "src/tests/infrastructure/profiles.test.ts",
  "src/tests/infrastructure/users.test.ts",
  "src/tests/presentation/selectors.test.ts",
  "src/tests/presentation/ssr.test.ts",
];

const genPreferredSourceFiles = (): readonly string[] => [
  "src/page-data/BrowserPageData.ts",
  "src/presentation/AuthSessionStorage.ts",
  "src/presentation/BrowserApiClient.ts",
  "src/presentation/BrowserAuth.ts",
  "src/presentation/State.ts",
];

const linkSourceFiles = (): readonly string[] => [
  "src/presentation/ArticlePage.ts",
  "src/presentation/Feed.ts",
  "src/presentation/Layout.ts",
  "src/presentation/ProfilePage.ts",
  "src/routes/login.ts",
  "src/routes/register.ts",
];

const effectUnknownErrorChannelLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /Effect(?:\.Effect)?<[^>\n,]+,\s*unknown(?:\s*[>,])/.test(line) ? [index + 1] : []);

const effectCombinatorLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /Effect\.(?:flatMap|map)\(/.test(line) ? [index + 1] : []);

const rawAnchorHrefLines = (path: string): readonly number[] => {
  const lines = readText(path).split("\n");
  const offenders: number[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes("<a")) continue;

    let openingTag = lines[index];
    const startLine = index + 1;
    while (!openingTag.includes(">") && index + 1 < lines.length) {
      index += 1;
      openingTag += `\n${lines[index]}`;
    }

    if (openingTag.includes("href=")) offenders.push(startLine);
  }

  return offenders;
};

const stackedProvideLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /ServiceLayers\.reduce|provideServices|Effect\.provide\(/.test(line)
        ? [index + 1]
        : []);
