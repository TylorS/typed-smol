import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
      "@storybook/builder-vite",
      "@typed/cli",
      "@typed/storybook",
      "@typed/tsconfig",
      "@typed/virtual-modules-compiler",
      "@typed/virtual-modules-ts-plugin",
      "@typed/vite-plugin",
      "@types/node",
      "happy-dom",
      "oxfmt",
      "oxlint",
      "storybook",
      "typescript",
      "vite",
      "vitest",
    ]);
  });

  it("exposes every required local workflow script", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(pkg.scripts.dev).toBe("typed dev");
    expect(pkg.scripts.build).toBe("typed build");
    expect(pkg.scripts.check).toBe("typed check");
    expect(pkg.scripts.preview).toBe("typed preview");
    expect(pkg.scripts.test).toBe("typed test");
    expect(pkg.scripts.typecheck).toBe("typed check");
    expect(pkg.scripts.build).not.toContain("vmc");
    expect(pkg.scripts.dev).not.toContain("vite");
    expect(pkg.scripts["db:migrate"]).toContain("vmc -p tsconfig.json");

    const expectedScripts = [
      "build",
      "check",
      "db:migrate",
      "db:reset",
      "db:seed",
      "dev",
      "devtools:local",
      "preview",
      "storybook",
      "storybook:build",
      "test",
      "test:acceptance:local",
      "test:api:hurl:local",
      "test:e2e:local",
      "test:hmr:local",
      "test:integration",
      "test:ssr",
      "test:unit",
      "typecheck",
      "typecheck:stories",
    ];
    if (pkg.scripts["test:devtools:local"]) {
      expectedScripts.push("test:devtools:local");
    }

    expect(Object.keys(pkg.scripts).sort()).toEqual(expectedScripts.sort());
  });

  it("contains the required config, entry, ignore, and asset files", () => {
    expect(readText(".gitignore")).toContain(".data/");
    expect(readText(".gitignore")).toContain("playwright-report/");
    expect(readText(".gitignore")).toContain("test-results/");
    expect(readText(".gitignore")).toContain(".hurl/");

    expect(readText("vmc.config.ts")).toContain("createTypedVirtualModulePlugins");
    expect(readText("vmc.config.ts")).not.toContain("createRouteHandlersVirtualModulePlugin");
    expect(readText("vmc.config.ts")).not.toContain('from "@typed/app";');
    expect(existsSync(resolve(projectRoot, "src/types/typed-virtual-modules.d.ts"))).toBe(false);
    expect(readText("vite.config.ts")).toContain("typedVitePlugin");
    expect(readText("typed.config.ts")).toContain("defineConfig");
    expect(readText("typed.config.ts")).not.toContain('from "@typed/app";');

    expect(existsSync(resolve(projectRoot, "index.html"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/main.ts"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/server.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/browser.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/ssr.ts"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "src/browser-routes"))).toBe(false);
    expect(existsSync(resolve(projectRoot, "public/default-avatar.svg"))).toBe(true);
  });

  it("lets typed.config.ts provide the Vite server entry for API dev routing", () => {
    const viteConfig = readText("vite.config.ts");

    expect(viteConfig).toContain("typedVitePlugin()");
    expect(viteConfig).not.toContain("typedVitePlugin({");
    expect(readText("typed.config.ts")).toContain('entry: "src/server.ts"');
  });

  it("uses the SSR outlet and explicitly configures the browser root", () => {
    const html = readText("index.html");
    const browserEntry = readText("src/browser.ts");

    expect(html).toContain('<div id="typed-root"><!--typed-ssr-outlet--></div>');
    expect(html).not.toContain('<div id="app"></div>');
    expect(browserEntry).not.toContain("root:");
    expect(existsSync(resolve(projectRoot, "src/.browser.dependencies.ts"))).toBe(true);
    expect(readText("src/.browser.dependencies.ts")).toContain("BrowserAuth.WithState");
  });

  it("does not assume unauthenticated auth state from the server companion", () => {
    const serverDependencies = readText("src/.server.dependencies.ts");

    expect(serverDependencies).not.toContain('getAuthState: Effect.succeed("unauthenticated")');
    expect(serverDependencies).toContain('getAuthState: Effect.succeed("unavailable")');
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

  it("lets satisfies Handler provide route template parameter types", () => {
    for (const path of routeSourceFiles()) {
      const source = readText(path);

      expect(source, path).not.toContain("RefSubject.RefSubject<Params>");
      expect(source, path).not.toMatch(/import type \{[^}]*\bParams\b/);
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

  it("uses shared recursive API prefixes instead of repeating resource path roots", () => {
    for (const path of [
      "src/api/articles/_prefix.ts",
      "src/api/articles/comments/_prefix.ts",
      "src/api/profiles/_prefix.ts",
      "src/api/tags/_prefix.ts",
      "src/api/user/_prefix.ts",
      "src/api/users/_prefix.ts",
    ]) {
      expect(existsSync(resolve(projectRoot, path)), path).toBe(true);
    }

    expect(existsSync(resolve(projectRoot, "src/api/comments"))).toBe(false);

    const repeatedRoots = apiEndpointSourceFiles().flatMap((path) =>
      repeatedApiRoutePrefixLines(path).map((line) => `${path}:${line}`),
    );

    expect(repeatedRoots).toEqual([]);
  });

  it("declares an HttpApiGroup companion for every API resource directory", () => {
    const expectedGroups = [
      "src/api/articles/_group.ts",
      "src/api/articles/comments/_group.ts",
      "src/api/profiles/_group.ts",
      "src/api/tags/_group.ts",
      "src/api/user/_group.ts",
      "src/api/users/_group.ts",
    ];

    for (const path of expectedGroups) {
      expect(existsSync(resolve(projectRoot, path)), path).toBe(true);
      expect(readText(path), path).toContain("export const name");
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
    expect(existsSync(resolve(projectRoot, "src/common/ClientApi.ts"))).toBe(false);

    const apiFacadeSource = readText("src/Api.ts");
    expect(apiFacadeSource).toContain('import { Api } from "typed:api?dir=./api&mode=client"');
    expect(apiFacadeSource).not.toContain(
      'import { Api, Client } from "typed:api?dir=./api&mode=client"',
    );
    expect(apiFacadeSource).not.toContain("export { Api, Client }");
    expect(apiFacadeSource).not.toContain("OpenApi");
    expect(readText("src/common/BrowserApiClient.ts")).toContain('from "../Api.js"');
    expect(readText("src/common/routeData.ts")).toContain("decodedRouteApiClient");
    expect(readText("src/common/State.ts")).toContain('from "../Api.js"');

    for (const path of productionSourceFiles()) {
      expect(readText(path), path).not.toContain("ClientApi");
      expect(readText(path), path).not.toContain("createRealWorldClient");
    }
  });

  it("does not name empty request parameter shapes", () => {
    expect(readText("src/common/routeData.ts")).not.toContain("EmptyQuery");
  });

  it("does not keep form workflow behavior in a catch-all FormEvents module", () => {
    expect(existsSync(resolve(projectRoot, "src/common/FormEvents.ts"))).toBe(false);

    for (const path of [...routeSourceFiles(), ...componentSourceFiles()]) {
      expect(readText(path), path).not.toContain("FormEvents.js");
    }
  });

  it("does not install a browser debug API for auth state", () => {
    expect(existsSync(resolve(projectRoot, "src/common/Debug.ts"))).toBe(false);

    for (const path of productionSourceFiles()) {
      expect(readText(path), path).not.toContain("__conduit_debug__");
      expect(readText(path), path).not.toContain("installConduitDebug");
    }
  });

  it("does not expose explicit initialize effects on services", () => {
    for (const path of productionSourceFiles()) {
      expect(readText(path), path).not.toMatch(/\binitialize\s*:/);
      expect(readText(path), path).not.toContain(".initialize");
    }
  });

  it("keeps error type definitions out of infrastructure modules", () => {
    const offenders = infrastructureSourceFiles().flatMap((path) =>
      infrastructureErrorDefinitionLines(path).map((line) => `${path}:${line}`),
    );

    expect(offenders).toEqual([]);
  });

  it("does not use unknown as an Effect error channel in production source", () => {
    const offenders = productionSourceFiles().flatMap((path) =>
      effectUnknownErrorChannelLines(path).map((line) => `${path}:${line}`),
    );

    expect(offenders).toEqual([]);
  });

  it("uses Effect.gen for sequential browser state effects", () => {
    const offenders = genPreferredSourceFiles().flatMap((path) =>
      effectCombinatorLines(path).map((line) => `${path}:${line}`),
    );

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

  it("keeps UI render components to one render export per file", () => {
    for (const path of componentSourceFiles()) {
      const source = readText(path);
      const fxComponents = source.match(/export const \w+ = Fx\.(?:fn|gen)\b/g) ?? [];
      const staticComponents = source.match(/export const \w+ = html`/g) ?? [];

      expect([...fxComponents, ...staticComponents], path).toHaveLength(1);
    }
  });

  it("uses @typed/ui Link for internal navigation anchors", () => {
    const offenders = linkSourceFiles().flatMap((path) =>
      rawAnchorHrefLines(path).map((line) => `${path}:${line}`),
    );

    expect(offenders).toEqual([]);
  });

  it("uses @typed/ui primitives for product buttons and submit controls", () => {
    const buttonOffenders = buttonSourceFiles().flatMap((path) =>
      rawButtonLines(path).map((line) => `${path}:${line}`),
    );

    expect(buttonOffenders).toEqual([]);
  });

  it("provides SqlClient through layers instead of rebuilding sqlite per repository call", () => {
    const dependencyLayer = readText("src/.server.dependencies.ts");
    const offenders = repositorySourceFiles().flatMap((path) =>
      readText(path).includes("runSql") ? [path] : [],
    );

    expect(dependencyLayer).toContain("SqliteLive");
    expect(offenders).toEqual([]);
  });

  it("reuses API dependencies for server route data instead of duplicating them", () => {
    const dependencyLayer = readText("src/.server.dependencies.ts");

    expect(dependencyLayer).toContain('from "typed:api?dir=./api"');
    expect(dependencyLayer).toContain("ApiDependenciesLayer");
    expect(dependencyLayer).not.toContain("ApplicationServices");
    expect(dependencyLayer).not.toContain("UserRepository.Live");
    expect(dependencyLayer).not.toContain("PasswordHasher.Live");
  });

  it("uses composed Layer test harnesses instead of stacked Effect.provide", () => {
    const offenders = layerHarnessSourceFiles().flatMap((path) =>
      stackedProvideLines(path).map((line) => `${path}:${line}`),
    );

    expect(offenders).toEqual([]);
  });
});

const productionSourceFiles = (): readonly string[] => [
  "src/application/Articles.ts",
  "src/application/Comments.ts",
  "src/application/Profiles.ts",
  "src/application/Tags.ts",
  "src/application/Users.ts",
  "src/browser.ts",
  "src/common/http.ts",
  "src/common/routes.ts",
  "src/common/routeData.ts",
  "src/common/serverApiClient.ts",
  "src/common/BrowserAuth.ts",
  "src/common/formInput.ts",
  "src/common/workflowErrors.ts",
  "src/common/State.ts",
];

const routeSourceFiles = (): readonly string[] => [
  "src/routes/__hmr-ui.ts",
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

const asyncPageSourceFiles = (): readonly string[] => ["src/common/components/AsyncDataView.ts"];

const componentSourceFiles = (): readonly string[] => [
  "src/common/components/ArticleContent.ts",
  "src/common/components/ArticleList.ts",
  "src/common/components/ArticleMeta.ts",
  "src/common/components/ArticlePreviewCard.ts",
  "src/common/components/ArticleTag.ts",
  "src/common/components/AsyncDataView.ts",
  "src/common/components/AuthorMeta.ts",
  "src/common/components/Banner.ts",
  "src/common/components/CommentCard.ts",
  "src/common/components/CommentForm.ts",
  "src/common/components/EmptyFeedMessage.ts",
  "src/common/components/FeedContent.ts",
  "src/common/components/FeedTag.ts",
  "src/common/components/FeedToggle.ts",
  "src/common/components/Message.ts",
  "src/common/components/Navbar.ts",
  "src/common/components/PageLink.ts",
  "src/common/components/Pagination.ts",
  "src/common/components/ProfileContent.ts",
  "src/common/components/ProfileTab.ts",
  "src/common/components/SelectedTagTab.ts",
  "src/common/components/TagSidebar.ts",
  "src/common/components/TagSidebarLink.ts",
];

const apiEndpointSourceFiles = (): readonly string[] => [
  "src/api/articles/create.ts",
  "src/api/articles/delete.ts",
  "src/api/articles/favorite.ts",
  "src/api/articles/feed.ts",
  "src/api/articles/get.ts",
  "src/api/articles/list.ts",
  "src/api/articles/comments/create.ts",
  "src/api/articles/comments/delete.ts",
  "src/api/articles/comments/list.ts",
  "src/api/articles/unfavorite.ts",
  "src/api/articles/update.ts",
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

const infrastructureSourceFiles = (): readonly string[] => sourceFilesUnder("src/infrastructure");

const sourceFilesUnder = (dir: string): readonly string[] =>
  readdirSync(resolve(projectRoot, dir), { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return [...sourceFilesUnder(path)];
      return path.endsWith(".ts") ? [path] : [];
    })
    .sort();

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
  "src/common/routeData.ts",
  "src/common/AuthSessionStorage.ts",
  "src/common/BrowserApiClient.ts",
  "src/common/BrowserAuth.ts",
  "src/common/State.ts",
];

const linkSourceFiles = (): readonly string[] => [
  "src/common/components/ArticleMeta.ts",
  "src/common/components/ArticlePreviewCard.ts",
  "src/common/components/AuthorMeta.ts",
  "src/common/components/CommentCard.ts",
  "src/common/components/FeedToggle.ts",
  "src/common/components/Navbar.ts",
  "src/common/components/PageLink.ts",
  "src/common/components/ProfileTab.ts",
  "src/common/components/SelectedTagTab.ts",
  "src/common/components/TagSidebarLink.ts",
  "src/routes/login.ts",
  "src/routes/register.ts",
];

const buttonSourceFiles = (): readonly string[] => [
  "src/common/components/ArticleContent.ts",
  "src/common/components/AuthorMeta.ts",
  "src/common/components/CommentCard.ts",
  "src/common/components/CommentForm.ts",
  "src/common/components/ProfileContent.ts",
  "src/routes/editor-slug.ts",
  "src/routes/editor.ts",
  "src/routes/login.ts",
  "src/routes/register.ts",
  "src/routes/settings.ts",
];

const effectUnknownErrorChannelLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /Effect(?:\.Effect)?<[^>\n,]+,\s*unknown(?:\s*[>,])/.test(line) ? [index + 1] : [],
    );

const repeatedApiRoutePrefixLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /Route\.(?:Parse|Join)\([^)]*"\/(?:articles|profiles|tags|user|users)(?:\/|")/.test(line)
        ? [index + 1]
        : [],
    );

const effectCombinatorLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) => (/Effect\.(?:flatMap|map)\(/.test(line) ? [index + 1] : []));

const infrastructureErrorDefinitionLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /^\s*(?:export\s+)?(?:class|interface)\s+\w*Error\b/.test(line) ||
      /^\s*(?:export\s+)?type\s+\w*Error\b\s*=/.test(line) ||
      /\b(?:Data|Schema)\.TaggedError(?:Class)?\b/.test(line)
        ? [index + 1]
        : [],
    );

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

const rawButtonLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) => (line.includes("<button") ? [index + 1] : []));

const stackedProvideLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /ServiceLayers\.reduce|provideServices|Effect\.provide\(/.test(line) ? [index + 1] : [],
    );
