/// <reference types="node" />
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { createTypeInfoApiSession, PluginManager } from "@typed/virtual-modules";
import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import {
  createRouterVirtualModulePlugin,
  parseRouterVirtualModuleId,
  resolveRouterTargetDirectory,
} from "./RouterVirtualModulePlugin.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const base = join(process.cwd(), "tmp-router-test");
  try {
    mkdirSync(base, { recursive: true });
  } catch {
    // ignore
  }
  const dir = mkdtempSync(join(base, "run-"));
  tempDirs.push(dir);
  return dir;
};

/**
 * Declarative filesystem fixture. Keys are paths relative to root (forward slashes).
 * Creates root, writes each file (creating parent dirs), and returns importer + all paths.
 * If "src/entry.ts" is omitted, it is added with "export {};".
 */
type FixtureSpec = Record<string, string>;

function createFixture(spec: FixtureSpec): {
  root: string;
  importer: string;
  paths: string[];
} {
  const root = createTempDir();
  const normalized: FixtureSpec = { ...spec };
  if (!("src/entry.ts" in normalized)) {
    normalized["src/entry.ts"] = "export {};";
  }
  const sortedKeys = Object.keys(normalized).sort();
  const paths: string[] = [];
  for (const rel of sortedKeys) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, normalized[rel], "utf8");
    paths.push(abs);
  }
  const importer = join(root, "src/entry.ts");
  return { root, importer, paths };
}

/** Valid guard export: function returning Effect<Option<*>> so guard validation passes. */
const validGuardExport =
  'import * as Effect from "effect"; import * as Option from "effect/Option"; export const guard = (): Effect.Effect<Option.Option<unknown>> => Effect.succeed(Option.none());';

/**
 * Build router virtual module source from a declarative fixture and optional program file list.
 * If programFiles is omitted, uses fixture.paths (importer + all written files).
 * Returns string on success or VirtualModuleBuildError on validation failure.
 */
function buildRouterFromFixture(spec: FixtureSpec, programFiles?: string[]) {
  const fixture = createFixture(spec);
  const plugin = createRouterVirtualModulePlugin();
  const files = programFiles ?? fixture.paths;
  const program = makeProgram(files);
  const session = createTypeInfoApiSession({ ts, program });
  return plugin.build("router:./routes", fixture.importer, session.api);
}

const makeProgram = (rootFiles: readonly string[]): ts.Program =>
  ts.createProgram(rootFiles, {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  });

/** Route export using @typed/router so type is Route.Any. Path e.g. "/", "/home", "/users/:id". */
function routeExportForPath(path: string): string {
  const segments = path
    .replace(/^\/|\/$/g, "")
    .split("/")
    .filter(Boolean);
  if (segments.length === 0) {
    return 'import * as Route from "@typed/router";\nexport const route = Route.Slash;';
  }
  const parts = segments.map((s) =>
    s.startsWith(":")
      ? `Route.Param(${JSON.stringify(s.slice(1))})`
      : `Route.Parse(${JSON.stringify(s)})`,
  );
  const expr = parts.length === 1 ? parts[0] : `Route.Join(${parts.join(", ")})`;
  return `import * as Route from "@typed/router";\nexport const route = ${expr};`;
}

/** Shorthand for a route file with route + handler (plain value). */
function route(path: string, body: string): string {
  return `${routeExportForPath(path)}\n${body}`;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

// Snapshot test matrix and naming: .docs/workflows/20250221-1200-router-snapshot-test-design/00-router-snapshot-test-design.md
describe("RouterVirtualModulePlugin", () => {
  it("parses router id with ./ prefix", () => {
    const parsed = parseRouterVirtualModuleId("router:./routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
  });

  it("rejects ids that do not use the router prefix", () => {
    const parsed = parseRouterVirtualModuleId("virtual:./routes");
    expect(parsed.ok).toBe(false);
  });

  it("accepts router:routes without ./ prefix", () => {
    const parsed = parseRouterVirtualModuleId("router:routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "routes" });
  });

  it("resolves target directory from importer", () => {
    const { importer } = createFixture({ "src/routes/index.ts": "export {};" });

    const resolved = resolveRouterTargetDirectory("router:./routes", importer);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.targetDirectory.endsWith("/src/routes")).toBe(true);
  });

  it("shouldResolve returns true when target directory exists with .ts files", () => {
    const { importer } = createFixture({ "src/routes/index.ts": "export {};" });

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(true);
  });

  it("shouldResolve returns false when directory has no .ts files (AC-9)", () => {
    const { importer } = createFixture({ "src/routes/readme.txt": "no ts files" });

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(false);
  });

  it("shouldResolve returns false when target directory is missing", () => {
    const { importer } = createFixture({});

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(false);
  });

  it("build returns deterministic scaffold source", () => {
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/helper.ts": 'export const helper = "ok";',
    });
    expect(typeof result).toBe("string");
    const source = result as string;
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Users from "./routes/users.js";

      export default Router.match(Users.route, { handler: () => Fx.succeed(Users.handler) });
      "
    `);
  });

  it("build throws when entrypoint export exists without route export", () => {
    const result = buildRouterFromFixture({
      "src/routes/invalid.ts": 'export const handler = "oops";',
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ROUTE-001");
  });

  it("composes sibling and directory companions in ancestor->leaf order (TS-4)", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/users/profile.ts": route("/", "export const handler = 1;"),
      "src/routes/users/profile.dependencies.ts": "export const dependencies = [];",
    });
    expect(typeof source).toBe("string");
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as UsersProfile from "./routes/users/profile.js";
      import Dependencies from "./routes/_dependencies.js";
      import UsersProfiledependencies from "./routes/users/profile.dependencies.js";

      export default Router.match(UsersProfile.route, { handler: () => Fx.succeed(UsersProfile.handler), dependencies: UsersProfile.dependencies })
        .provide(UsersProfiledependencies)
        .provide(Dependencies);
      "
    `);
  });

  it("golden: directory dependencies and layout", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/api/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/item.ts": route("/", "export const handler = 1;"),
      "src/routes/api/item.catch.ts": "export const catchFn = () => null;",
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as ApiItem from "./routes/api/item.js";
      import Dependencies from "./routes/_dependencies.js";
      import ApiLayout from "./routes/api/_layout.js";

      export default Router.match(ApiItem.route, { handler: () => Fx.succeed(ApiItem.handler) })
        .layout(ApiLayout)
        .provide(Dependencies);
      "
    `);
  });

  it("golden: sibling dependencies and layout", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = 1;"),
      "src/routes/page.dependencies.ts": "export const dependencies = [];",
      "src/routes/page.layout.ts": "export const layout = (x: unknown) => x;",
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Page from "./routes/page.js";
      import Pagedependencies from "./routes/page.dependencies.js";
      import Pagelayout from "./routes/page.layout.js";

      export default Router.match(Page.route, { handler: () => Fx.succeed(Page.handler), dependencies: Page.dependencies, layout: Page.layout })
        .layout(Pagelayout)
        .provide(Pagedependencies);
      "
    `);
  });

  it("golden: sibling and directory companions", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/users/profile.ts": route("/", "export const handler = 1;"),
      "src/routes/users/profile.dependencies.ts": "export const dependencies = [];",
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as UsersProfile from "./routes/users/profile.js";
      import Dependencies from "./routes/_dependencies.js";
      import UsersProfiledependencies from "./routes/users/profile.dependencies.js";

      export default Router.match(UsersProfile.route, { handler: () => Fx.succeed(UsersProfile.handler), dependencies: UsersProfile.dependencies })
        .provide(UsersProfiledependencies)
        .provide(Dependencies);
      "
    `);
  });

  it("golden: multiple ancestors dependencies", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/api/_dependencies.ts": "export const apiDeps = [];",
      "src/routes/api/item.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as ApiItem from "./routes/api/item.js";
      import ApiDependencies from "./routes/api/_dependencies.js";
      import Dependencies from "./routes/_dependencies.js";

      export default Router.match(ApiItem.route, { handler: () => Fx.succeed(ApiItem.handler) })
        .provide(ApiDependencies)
        .provide(Dependencies);
      "
    `);
  });

  it("golden: sibling and directory layout", () => {
    const source = buildRouterFromFixture({
      "src/routes/api/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/item.ts": route("/", "export const handler = 1;"),
      "src/routes/api/item.layout.ts": "export const layout = (x: unknown) => x;",
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as ApiItem from "./routes/api/item.js";
      import ApiLayout from "./routes/api/_layout.js";
      import ApiItemlayout from "./routes/api/item.layout.js";

      export default Router.match(ApiItem.route, { handler: () => Fx.succeed(ApiItem.handler), layout: ApiItem.layout })
        .layout(ApiItemlayout)
        .layout(ApiLayout);
      "
    `);
  });

  it("build throws when multiple entrypoints are exported", () => {
    const result = buildRouterFromFixture({
      "src/routes/invalid.ts": `${routeExportForPath("/")}\nexport const handler = "a";\nexport const template = "b";`,
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ENTRY-002");
  });

  it("build throws when route export is not structurally compatible with Route", () => {
    const result = buildRouterFromFixture({
      "src/routes/bad.ts": "export const route = { foo: 1 }; export const handler = 1;",
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ROUTE-002");
  });

  it("build throws when route has no entrypoint", () => {
    const result = buildRouterFromFixture({
      "src/routes/noroute.ts": routeExportForPath("/"),
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ENTRY-001");
  });

  it("build throws when there are no valid route leaves", () => {
    const result = buildRouterFromFixture({
      "src/routes/helper.ts": "export const helper = 1;",
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-LEAF-001");
  });

  it("build returns RVM-ID-001 when virtual module id is invalid (e.g. empty relative path)", () => {
    const fixture = createFixture({ "src/routes/home.ts": route("/", "export const handler = 1;") });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("router:", fixture.importer, session.api);
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ID-001");
  });

  it("build returns RVM-DISC-001 when target directory does not exist", () => {
    const result = buildRouterFromFixture({});
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-DISC-001");
  });

  it("invalid guard (non-function) produces RVM-GUARD-001", () => {
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/users.guard.ts": "export const guard = true;",
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-GUARD-001");
  });

  it("invalid guard (wrong return type) produces RVM-GUARD-001", () => {
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/users.guard.ts": "export const guard = () => true;",
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-GUARD-001");
  });

  it("valid guard (Effect<Option<*>>) is accepted and emitted", () => {
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/users.guard.ts": validGuardExport,
    });
    if (typeof result !== "string") {
      expect(result).toMatchObject({ errors: expect.any(Array) });
      expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-GUARD-001");
      return;
    }
    expect(result).toContain("guard:");
    expect(result).toContain("UsersGuard.guard");
    expect(result).not.toContain("??");
  });

  it("guard default export is accepted and emitted", () => {
    const defaultGuardExport =
      'import * as Effect from "effect"; import * as Option from "effect/Option"; export default function guard(): Effect.Effect<Option.Option<unknown>> { return Effect.succeed(Option.none()); }';
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/users.guard.ts": defaultGuardExport,
    });
    if (typeof result !== "string") {
      expect(result).toMatchObject({ errors: expect.any(Array) });
      expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-GUARD-001");
      return;
    }
    expect(result).toContain("guard:");
    expect(result).toContain("UsersGuard.default");
    expect(result).not.toContain("??");
  });

  it("classifies plain entrypoint and sets needsLift (TS-5, AC-11)", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 42;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Home from "./routes/home.js";

      export default Router.match(Home.route, { handler: () => Fx.succeed(Home.handler) });
      "
    `);
  });

  it("effect-valued handler without explicit type is lifted as plain (Fx.succeed) (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/effect.ts": `import * as Effect from "effect"; ${routeExportForPath("/")} export const handler = Effect.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MEffect from "./routes/effect.js";

      export default Router.match(MEffect.route, { handler: () => Fx.succeed(MEffect.handler) });
      "
    `);
  });

  it("fx-valued handler without explicit type is lifted as plain (Fx.succeed) (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx"; ${routeExportForPath("/")} export const handler = Fx.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MFx from "./routes/fx.js";

      export default Router.match(MFx.route, { handler: () => Fx.succeed(MFx.handler) });
      "
    `);
  });

  it("stream-valued handler is classified as stream (fromStream) (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/stream.ts": `import { Stream } from "effect"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MStream from "./routes/stream.js";

      export default Router.match(MStream.route, { handler: () => Fx.fromStream(MStream.handler) });
      "
    `);
  });

  it("plain function handler: emits (params) => Fx.succeed(M.handler(params))", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Page from "./routes/page.js";

      export default Router.match(Page.route, { handler: (params) => Fx.succeed(Page.handler(params)) });
      "
    `);
  });

  it("effect-like function handler: passes through when return type is Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/async.ts": `import * as Fx from "@typed/fx"; ${routeExportForPath("/")} export const handler = (_p: unknown): Fx.Fx<number> => Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    const source = result as string;
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Async from "./routes/async.js";

      export default Router.match(Async.route, { handler: Async.handler });
      "
    `);
  });

  it("handler matrix: plain value emits () => Fx.succeed(M.handler)", () => {
    const source = buildRouterFromFixture({
      "src/routes/v.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as V from "./routes/v.js";

      export default Router.match(V.route, { handler: () => Fx.succeed(V.handler) });
      "
    `);
  });

  it("handler matrix: plain function emits (params) => Fx.succeed(M.handler(params))", () => {
    const source = buildRouterFromFixture({
      "src/routes/f.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as F from "./routes/f.js";

      export default Router.match(F.route, { handler: (params) => Fx.succeed(F.handler(params)) });
      "
    `);
  });

  it("handler matrix: Effect value uses fromEffect when type resolves as Effect", () => {
    const result = buildRouterFromFixture({
      "src/routes/e.ts": `import * as Effect from "effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as E from "./routes/e.js";

      export default Router.match(E.route, { handler: () => Fx.fromEffect(E.handler) });
      "
    `);
  });

  it("handler matrix: Effect function uses fromEffect when return type resolves as Effect", () => {
    const result = buildRouterFromFixture({
      "src/routes/ef.ts": `import * as Effect from "effect"; ${routeExportForPath("/")} export const handler = (_p: unknown): Effect.Effect<number> => Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Ef from "./routes/ef.js";

      export default Router.match(Ef.route, { handler: (params) => Fx.fromEffect(Ef.handler(params)) });
      "
    `);
  });

  it("handler matrix: Stream value uses fromStream when type resolves as Stream", () => {
    const result = buildRouterFromFixture({
      "src/routes/s.ts": `import { Stream } from "effect"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as S from "./routes/s.js";

      export default Router.match(S.route, { handler: () => Fx.fromStream(S.handler) });
      "
    `);
  });

  it("handler matrix: Stream function uses fromStream when return type resolves as Stream", () => {
    const result = buildRouterFromFixture({
      "src/routes/sf.ts": `import { Stream } from "effect"; ${routeExportForPath("/")} export const handler = (_p: unknown) => Stream.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Sf from "./routes/sf.js";

      export default Router.match(Sf.route, { handler: (params) => Fx.fromStream(Sf.handler(params)) });
      "
    `);
  });

  it("handler matrix: Fx value pass-through when type resolves as Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/x.ts": `import * as Fx from "@typed/fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as X from "./routes/x.js";

      export default Router.match(X.route, { handler: () => X.handler });
      "
    `);
  });

  it("handler matrix: Fx function pass-through when return type resolves as Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/xf.ts": `import * as Fx from "@typed/fx"; ${routeExportForPath("/")} export const handler = (_p: unknown): Fx.Fx<number> => Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Xf from "./routes/xf.js";

      export default Router.match(Xf.route, { handler: Xf.handler });
      "
    `);
  });

  it("unchanged inputs produce identical output (T-08, TS-6)", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session1 = createTypeInfoApiSession({ ts, program });
    const session2 = createTypeInfoApiSession({ ts, program });
    const source1 = plugin.build("router:./routes", fixture.importer, session1.api);
    const source2 = plugin.build("router:./routes", fixture.importer, session2.api);
    expect(source1).toBe(source2);
  });

  it("emits readonly descriptor metadata with as const (T-08, TS-7)", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Home from "./routes/home.js";

      export default Router.match(Home.route, { handler: () => Fx.succeed(Home.handler) });
      "
    `);
  });

  it("golden: single route with handler only", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Home from "./routes/home.js";

      export default Router.match(Home.route, { handler: () => Fx.succeed(Home.handler) });
      "
    `);
  });

  it("golden: plain function handler", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Page from "./routes/page.js";

      export default Router.match(Page.route, { handler: (params) => Fx.succeed(Page.handler(params)) });
      "
    `);
  });

  it("golden: fx handler pass-through", () => {
    const result = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MFx from "./routes/fx.js";

      export default Router.match(MFx.route, { handler: () => MFx.handler });
      "
    `);
  });

  it("golden: effect handler pass-through", () => {
    const result = buildRouterFromFixture({
      "src/routes/effect.ts": `import * as Effect from "effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MEffect from "./routes/effect.js";

      export default Router.match(MEffect.route, { handler: () => Fx.fromEffect(MEffect.handler) });
      "
    `);
  });

  it("golden: stream handler pass-through", () => {
    const source = buildRouterFromFixture({
      "src/routes/stream.ts": `import { Stream } from "effect"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as MStream from "./routes/stream.js";

      export default Router.match(MStream.route, { handler: () => Fx.fromStream(MStream.handler) });
      "
    `);
  });

  it("golden: template entrypoint", () => {
    const source = buildRouterFromFixture({
      "src/routes/template.ts": route("/", 'export const template = "<div/>";'),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Template from "./routes/template.js";

      export default Router.match(Template.route, { handler: () => Fx.succeed(Template.template) });
      "
    `);
  });

  it("golden: multiple routes at same level", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/home", "export const handler = 1;"),
      "src/routes/about.ts": route("/about", "export const handler = 1;"),
      "src/routes/contact.ts": route("/contact", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as About from "./routes/about.js";
      import * as Contact from "./routes/contact.js";
      import * as Home from "./routes/home.js";

      export default Router.match(About.route, { handler: () => Fx.succeed(About.handler) })
        .match(Contact.route, { handler: () => Fx.succeed(Contact.handler) })
        .match(Home.route, { handler: () => Fx.succeed(Home.handler) });
      "
    `);
  });

  it("golden: nested routes", () => {
    const source = buildRouterFromFixture({
      "src/routes/users/index.ts": route("/users", "export const handler = 1;"),
      "src/routes/users/profile.ts": route("/users/profile", "export const handler = 1;"),
      "src/routes/users/[id].ts": route("/users/:id", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as UsersId from "./routes/users/[id].js";
      import * as UsersIndex from "./routes/users/index.js";
      import * as UsersProfile from "./routes/users/profile.js";

      export default Router.match(UsersId.route, { handler: () => Fx.succeed(UsersId.handler) })
        .match(UsersIndex.route, { handler: () => Fx.succeed(UsersIndex.handler) })
        .match(UsersProfile.route, { handler: () => Fx.succeed(UsersProfile.handler) });
      "
    `);
  });

  it("golden: index route", () => {
    const source = buildRouterFromFixture({
      "src/routes/index.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Index from "./routes/index.js";

      export default Router.match(Index.route, { handler: () => Fx.succeed(Index.handler) });
      "
    `);
  });

  it("golden: default entrypoint", () => {
    const source = buildRouterFromFixture({
      "src/routes/default.ts": `${routeExportForPath("/")} export default 1;`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as Default from "./routes/default.js";

      export default Router.match(Default.route, { handler: () => Fx.succeed(Default.default) });
      "
    `);
  });

  it("golden: provide and layout order leaf to ancestor (chain: closest first)", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/api/_dependencies.ts": "export const apiDeps = [];",
      "src/routes/api/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/items/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/items/x.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as ApiItemsX from "./routes/api/items/x.js";
      import ApiDependencies from "./routes/api/_dependencies.js";
      import Dependencies from "./routes/_dependencies.js";
      import ApiItemsLayout from "./routes/api/items/_layout.js";
      import ApiLayout from "./routes/api/_layout.js";

      export default Router.match(ApiItemsX.route, { handler: () => Fx.succeed(ApiItemsX.handler) })
        .layout(ApiItemsLayout)
        .layout(ApiLayout)
        .provide(ApiDependencies)
        .provide(Dependencies);
      "
    `);
  });

  it("allows routes with identical route type in different files (file-scoped identity, no RVM-AMBIGUOUS-001) (TS-9)", () => {
    const source = buildRouterFromFixture({
      "src/routes/shared.ts": routeExportForPath("/"),
      "src/routes/a.ts": `import { route } from "./shared"; export { route }; export const handler = 1;`,
      "src/routes/b.ts": `import { route } from "./shared"; export { route }; export const handler = 2;`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as A from "./routes/a.js";
      import * as B from "./routes/b.js";

      export default Router.match(A.route, { handler: () => Fx.succeed(A.handler) })
        .match(B.route, { handler: () => Fx.succeed(B.handler) });
      "
    `);
  });

  it("multiple routes from shared route type are ordered by file path (T-10, TS-9)", () => {
    const source = buildRouterFromFixture({
      "src/routes/shared.ts": routeExportForPath("/"),
      "src/routes/a.ts": `import { route } from "./shared"; export { route }; export const handler = 1;`,
      "src/routes/b.ts": `import { route } from "./shared"; export { route }; export const handler = 2;`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx";
      import * as A from "./routes/a.js";
      import * as B from "./routes/b.js";

      export default Router.match(A.route, { handler: () => Fx.succeed(A.handler) })
        .match(B.route, { handler: () => Fx.succeed(B.handler) });
      "
    `);
  });
});

describe("RouterVirtualModulePlugin integration", () => {
  it("resolves through PluginManager when target exists with valid routes (SG-C1)", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const program = makeProgram(fixture.paths);
    const sessionFactory = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "router:./routes",
      importer: fixture.importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.pluginName).toBe("router-virtual-module");
    expect(resolved.sourceText).toContain("Router.match");
    expect(resolved.sourceText).toContain("export default ");
  });

  it("returns unresolved through PluginManager when id does not match (T-09)", () => {
    const { importer } = createFixture({});
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);
    const resolved = manager.resolveModule({ id: "other:something", importer });
    expect(resolved.status).toBe("unresolved");
  });

  it("returns unresolved through PluginManager when target directory has no .ts files (T-09)", () => {
    const { importer } = createFixture({ "src/routes/readme.txt": "no ts" });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);
    const resolved = manager.resolveModule({ id: "router:./routes", importer });
    expect(resolved.status).toBe("unresolved");
  });

  it("returns error when build throws (invalid routes)", () => {
    const fixture = createFixture({ "src/routes/bad.ts": "export const handler = 1;" });
    const program = makeProgram(fixture.paths);
    const sessionFactory = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "router:./routes",
      importer: fixture.importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("RVM-ROUTE-001");
    expect(resolved.diagnostic.message).toContain('missing "route" export');
  });
});
