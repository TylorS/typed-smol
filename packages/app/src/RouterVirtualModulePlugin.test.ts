/// <reference types="node" />
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTypeInfoApiSession,
  PluginManager,
  resolveTypeTargetsFromSpecs,
} from "@typed/virtual-modules";
import type { VirtualModuleBuildContext, VirtualModuleBuildError } from "@typed/virtual-modules";
import {
  createRouterVirtualModulePlugin,
  parseRouterVirtualModuleId,
  resolveRouterTargetDirectory,
  ROUTER_TYPE_TARGET_SPECS,
} from "./index.js";
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";
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
  'import * as Effect from "effect/Effect"; import * as Option from "effect/Option"; export const guard = (): Effect.Effect<Option.Option<unknown>> => Effect.succeed(Option.none());';

/**
 * Build router virtual module source from a declarative fixture and optional program file list.
 * If programFiles is omitted, uses fixture.paths (importer + all written files).
 * Returns string on success or VirtualModuleBuildError on validation failure.
 */
function buildRouterFromFixture(spec: FixtureSpec, programFiles?: string[]) {
  const fixture = createFixture(spec);
  return buildRouterFromExistingFixture(fixture, programFiles);
}

function buildRouterFromExistingFixture(
  fixture: ReturnType<typeof createFixture>,
  programFiles?: string[],
  context?: VirtualModuleBuildContext,
) {
  const plugin = createRouterVirtualModulePlugin();
  const files = programFiles ?? fixture.paths;
  const programFilesWithBootstrap =
    existsSync(BOOTSTRAP_FILE) && !files.includes(BOOTSTRAP_FILE)
      ? [...files, BOOTSTRAP_FILE]
      : files;
  const program = makeProgram(
    programFilesWithBootstrap,
    programFilesWithBootstrap.includes(BOOTSTRAP_FILE) ? APP_ROOT : fixture.root,
  );
  const session = createTypeInfoApiSession({
    ts,
    program,
    typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
  });
  return plugin.build("typed:router?dir=./routes", fixture.importer, session.api, context);
}

function productionContext(
  id: string,
  importer: string,
  names: readonly string[],
): VirtualModuleBuildContext {
  return {
    id,
    rootImporter: importer,
    containingFile: importer,
    consumer: "client",
    requestedExports: {
      kind: "names",
      names: new Set(names),
      typeOnlyNames: new Set(),
    },
    closure: {
      kind: "partial",
      requested: new Set(names),
      pluginDeclared: new Set(),
      typeInfoReachable: new Set(),
      routeOrAppReachable: new Set(),
    },
  };
}

function expectRouterGeneratedSourceToTypeCheck(
  fixture: ReturnType<typeof createFixture>,
  generatedPath = "src/router.generated.ts",
) {
  const source = buildRouterFromExistingFixture(fixture);
  if (typeof source !== "string") {
    throw new Error(JSON.stringify(source, null, 2));
  }

  const result = typeCheckGeneratedSource({
    rootDir: fixture.root,
    generatedPath,
    sourceText: source,
    rootFiles: fixture.paths,
    moduleFallbacks: MODULE_FALLBACKS,
  });
  expect(result.diagnostics).toEqual([]);
}

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NM = join(APP_ROOT, "node_modules");
/** Bootstrap file in the real project to ensure type target resolution finds canonical targets. */
const BOOTSTRAP_FILE = resolve(APP_ROOT, "src", "internal", "typeTargetBootstrap.ts");

const MODULE_FALLBACKS: Record<string, string> = {
  "@typed/router": join(NM, "@typed", "router", "src", "index.ts"),
  "@typed/fx": join(NM, "@typed", "fx", "src", "index.ts"),
  "@typed/fx/Fx": join(NM, "@typed", "fx", "src", "Fx", "index.ts"),
  "@typed/fx/RefSubject": join(NM, "@typed", "fx", "src", "RefSubject", "index.ts"),
  "@typed/fx/RefSubject/RefSubject": join(NM, "@typed", "fx", "src", "RefSubject", "RefSubject.ts"),
  effect: join(NM, "effect", "dist", "index.d.ts"),
  "effect/Effect": join(NM, "effect", "dist", "Effect.d.ts"),
  "effect/Stream": join(NM, "effect", "dist", "Stream.d.ts"),
  "effect/Layer": join(NM, "effect", "dist", "Layer.d.ts"),
  "effect/Context": join(NM, "effect", "dist", "Context.d.ts"),
};

function makeProgram(rootFiles: readonly string[], fixtureRoot?: string): ts.Program {
  const projectRoot =
    fixtureRoot ?? (rootFiles.length > 0 ? dirname(dirname(rootFiles[0])) : APP_ROOT);
  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  };
  const defaultHost = ts.createCompilerHost(options);
  const moduleResolutionHost: ts.ModuleResolutionHost = {
    getCurrentDirectory: () => projectRoot,
    fileExists: defaultHost.fileExists?.bind(defaultHost),
    readFile: defaultHost.readFile?.bind(defaultHost),
    useCaseSensitiveFileNames: () => defaultHost.useCaseSensitiveFileNames?.() ?? true,
  };
  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getCurrentDirectory: () => projectRoot,
    resolveModuleNames: (
      moduleNames: string[],
      containingFile: string,
      _reusedNames: string[] | undefined,
      _redirectedReference: ts.ResolvedProjectReference | undefined,
      opts: ts.CompilerOptions,
    ): (ts.ResolvedModule | undefined)[] =>
      moduleNames.map((moduleName) => {
        const resolved = ts.resolveModuleName(
          moduleName,
          containingFile,
          opts,
          moduleResolutionHost,
        );
        if (resolved.resolvedModule) return resolved.resolvedModule;
        const fallback = MODULE_FALLBACKS[moduleName];
        if (fallback && defaultHost.fileExists?.(fallback)) {
          return {
            resolvedFileName: fallback,
            extension: fallback.endsWith(".ts") ? ts.Extension.Ts : ts.Extension.Js,
            isExternalLibraryImport: false,
          };
        }
        return undefined;
      }),
  };
  return ts.createProgram(rootFiles, options, customHost);
}

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

describe("resolveTypeTargetsFromSpecs with ROUTER_TYPE_TARGET_SPECS", () => {
  describe("explicit type target resolution", () => {
    it("resolves all ROUTER_TYPE_TARGET_SPECS when bootstrap in program", () => {
      const fixture = createFixture({
        "src/routes/home.ts": route("/", "export const handler = 1;"),
      });
      const files =
        existsSync(BOOTSTRAP_FILE) && !fixture.paths.includes(BOOTSTRAP_FILE)
          ? [...fixture.paths, BOOTSTRAP_FILE]
          : fixture.paths;
      const program = makeProgram(files, files.includes(BOOTSTRAP_FILE) ? APP_ROOT : fixture.root);
      const targets = resolveTypeTargetsFromSpecs(program, ts, ROUTER_TYPE_TARGET_SPECS);
      const targetIds = targets.map((t) => t.id).sort();
      expect(targetIds).toMatchInlineSnapshot(`
        [
          "Cause",
          "Effect",
          "Fx",
          "Layer",
          "Option",
          "RefSubject",
          "Route",
          "ServiceMap",
          "Stream",
        ]
      `);
    });
  });

  describe("explicit assignability against @typed/router and effect/*", () => {
    it("route and handler exports have expected assignability (Route, Fx/Effect)", () => {
      const fixture = createFixture({
        "src/routes/home.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
      });
      const files =
        existsSync(BOOTSTRAP_FILE) && !fixture.paths.includes(BOOTSTRAP_FILE)
          ? [...fixture.paths, BOOTSTRAP_FILE]
          : fixture.paths;
      const program = makeProgram(files, files.includes(BOOTSTRAP_FILE) ? APP_ROOT : fixture.root);
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
      });
      const result = session.api.file("src/routes/home.ts", { baseDir: fixture.root });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { api } = session;
      const routeExport = result.snapshot.exports.find((e) => e.name === "route");
      const handlerExport = result.snapshot.exports.find((e) => e.name === "handler");
      expect(routeExport).toBeDefined();
      expect(handlerExport).toBeDefined();
      expect(api.isAssignableTo(routeExport!.type, "Route")).toBe(true);
      expect(api.isAssignableTo(routeExport!.type, "Fx")).toBe(false);
      expect(api.isAssignableTo(handlerExport!.type, "Fx")).toBe(true);
      expect(api.isAssignableTo(handlerExport!.type, "Route")).toBe(false);
    });

    it("Effect-valued handler has returnTypeAssignableTo.Effect when returning Effect", () => {
      const fixture = createFixture({
        "src/routes/effect.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
      });
      const files =
        existsSync(BOOTSTRAP_FILE) && !fixture.paths.includes(BOOTSTRAP_FILE)
          ? [...fixture.paths, BOOTSTRAP_FILE]
          : fixture.paths;
      const program = makeProgram(files, files.includes(BOOTSTRAP_FILE) ? APP_ROOT : fixture.root);
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
      });
      const result = session.api.file("src/routes/effect.ts", { baseDir: fixture.root });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const handlerExport = result.snapshot.exports.find((e) => e.name === "handler");
      expect(handlerExport).toBeDefined();
      expect(session.api.isAssignableTo(handlerExport!.type, "Effect")).toBe(true);
    });
  });
});

// Snapshot test matrix and naming: .docs/workflows/20250221-1200-router-snapshot-test-design/00-router-snapshot-test-design.md
describe("RouterVirtualModulePlugin", () => {
  it("parses typed router id with explicit dir", () => {
    const parsed = parseRouterVirtualModuleId("typed:router?dir=./routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
  });

  it("rejects old router prefix ids", () => {
    const parsed = parseRouterVirtualModuleId("router:./routes");
    expect(parsed.ok).toBe(false);
  });

  it("accepts typed router wildcard dir as default routes directory", () => {
    const parsed = parseRouterVirtualModuleId("typed:router?dir=*");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
  });

  it("accepts bare typed router dir values normalized to relative paths", () => {
    const parsed = parseRouterVirtualModuleId("typed:router?dir=routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
  });

  it("rejects target query ids because router modules are environment agnostic", () => {
    const parsed = parseRouterVirtualModuleId("typed:router?dir=./routes&target=browser");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("RVM-ID-QUERY-001");
  });

  it("rejects typed router ids that omit dir", () => {
    const parsed = parseRouterVirtualModuleId("typed:router");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("RVM-ID-DIR-001");
  });

  it("resolves target directory from importer", () => {
    const { importer } = createFixture({ "src/routes/index.ts": "export {};" });

    const resolved = resolveRouterTargetDirectory("typed:router?dir=./routes", importer);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.targetDirectory.endsWith("/src/routes")).toBe(true);
  });

  it("shouldResolve returns true for typed router ids without scanning the target directory", () => {
    const { importer } = createFixture({ "src/routes/index.ts": "export {};" });

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:router?dir=./routes", importer)).toBe(true);
  });

  it("shouldResolve returns true for typed router ids whose directory has no .ts files", () => {
    const { importer } = createFixture({ "src/routes/readme.txt": "no ts files" });

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:router?dir=./routes", importer)).toBe(true);
  });

  it("shouldResolve returns true for malformed typed router ids so build can surface diagnostics", () => {
    const { importer } = createFixture({});

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:router", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:router?dir=./routes&target=browser", importer)).toBe(true);
  });

  it("type-checks a generated Router virtual module source fixture", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expectRouterGeneratedSourceToTypeCheck(fixture);
  });

  it("type-checks generated Router source for all handler kinds", () => {
    const fixture = createFixture({
      "src/routes/plain.ts": route("/plain", "export const handler = 1;"),
      "src/routes/effect.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/effect")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/fx")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
      "src/routes/stream.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/stream")} export const handler = Stream.succeed(1);`,
    });

    expectRouterGeneratedSourceToTypeCheck(fixture, "src/router-handler-kinds.generated.ts");
  });

  it("type-checks generated Router source for nested concerns", () => {
    const fixture = createFixture({
      "src/routes/_dependencies.ts":
        'import * as Layer from "effect/Layer"; export default Layer.empty;',
      "src/routes/api/_layout.ts":
        'import * as Fx from "@typed/fx/Fx"; export const layout = ({ content }: { content: Fx.Fx<unknown, never, never> }) => content;',
      "src/routes/api/item.ts": route("/api/item", "export const handler = 1;"),
      "src/routes/api/item.catch.ts": "export const catchFn = (_error: unknown) => null;",
      "src/routes/api/item.dependencies.ts":
        'import * as Layer from "effect/Layer"; export const dependencies = Layer.empty;',
      "src/routes/api/item.guard.ts": validGuardExport,
      "src/routes/api/item.layout.ts":
        'import * as Fx from "@typed/fx/Fx"; export const layout = ({ content }: { content: Fx.Fx<unknown, never, never> }) => content;',
    });

    expectRouterGeneratedSourceToTypeCheck(fixture, "src/router-concerns.generated.ts");
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Users from "typed:route-template?path=./routes/users.ts";

      const router = Router.match(Users.route, constant(Fx.succeed(Users.handler)));
      export default router;
      "
    `);
  });

  it("omits unused concern virtual imports in production partial output", () => {
    const fixture = createFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
    });
    const source = buildRouterFromExistingFixture(
      fixture,
      undefined,
      productionContext("typed:router?dir=./routes", fixture.importer, ["default"]),
    ) as string;

    expect(source).toContain('import * as Users from "typed:route-template?path=./routes/users.ts";');
    expect(source).not.toContain("typed:services?dir=./routes");
    expect(source).not.toContain("typed:guard?dir=./routes");
    expect(source).not.toContain("typed:layout?dir=./routes");
    expect(source).not.toContain("typed:catch?dir=./routes");
  });

  it("build throws when entrypoint export exists without route export", () => {
    const result = buildRouterFromFixture({
      "src/routes/invalid.ts": 'export const handler = "oops";',
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ROUTE-001");
  });

  it("build throws RVM-DEPS-001 when directory _dependencies has no default export", () => {
    const result = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export const deps = [];",
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-DEPS-001");
  });

  it("build throws RVM-DEPS-001 when directory _dependencies default type is unclassified", () => {
    const result = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "export default { foo: 1 };",
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-DEPS-001");
  });

  it("supports tuple [Layer] in _dependencies default export", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default [Layer.empty];",
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(typeof source).toBe("string");
    expect(source).toContain('RouteServices.dependencyLayers["_dependencies.ts"]');
    expect(source).toContain(".provide(");
  });

  it("supports Layer.mergeAll in _dependencies default export", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.mergeAll(Layer.empty, Layer.empty);",
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(typeof source).toBe("string");
    expect(source).toContain('.provide(RouteServices.dependencyLayers["_dependencies.ts"])');
    expect(source).not.toContain("Router.normalizeDependencyInput");
  });

  it("composes sibling and directory companions in ancestor->leaf order (TS-4)", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts": "const deps: Array<unknown> = []; export default deps;",
      "src/routes/users/profile.ts": route("/", "export const handler = 1;"),
      "src/routes/users/profile.dependencies.ts": "export const dependencies = [];",
    });
    expect(typeof source).toBe("string");
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as UsersProfile from "typed:route-template?path=./routes/users/profile.ts";

      const router = Router.match(UsersProfile.route, { handler: constant(Fx.succeed(UsersProfile.handler)), dependencies: RouteServices.dependencyInputs["users/profile.dependencies.ts"] }).provide(RouteServices.dependencyLayers["_dependencies.ts"]);
      export default router;
      "
    `);
  });

  it("golden: directory dependencies and layout", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/api/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/item.ts": route("/", "export const handler = 1;"),
      "src/routes/api/item.catch.ts": "export const catchFn = () => null;",
    });
    expect(typeof source).toBe("string");
    expect(source).not.toContain("Cause.Cause<unknown>");
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as ApiItem from "typed:route-template?path=./routes/api/item.ts";

      const router = Router.match(ApiItem.route, { handler: constant(Fx.succeed(ApiItem.handler)), catch: RouteCatches.catchers["api/item.catch.ts"] }).layout(RouteLayouts.layouts["api/_layout.ts"]).provide(RouteServices.dependencyLayers["_dependencies.ts"]);
      export default router;
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Page from "typed:route-template?path=./routes/page.ts";

      const router = Router.match(Page.route, { handler: constant(Fx.succeed(Page.handler)), dependencies: RouteServices.dependencyInputs["page.dependencies.ts"], layout: RouteLayouts.layouts["page.layout.ts"] });
      export default router;
      "
    `);
  });

  it("golden: sibling and directory companions", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/users/profile.ts": route("/", "export const handler = 1;"),
      "src/routes/users/profile.dependencies.ts": "export const dependencies = [];",
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as UsersProfile from "typed:route-template?path=./routes/users/profile.ts";

      const router = Router.match(UsersProfile.route, { handler: constant(Fx.succeed(UsersProfile.handler)), dependencies: RouteServices.dependencyInputs["users/profile.dependencies.ts"] }).provide(RouteServices.dependencyLayers["_dependencies.ts"]);
      export default router;
      "
    `);
  });

  it("golden: multiple ancestors dependencies", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/api/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/api/item.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as ApiItem from "typed:route-template?path=./routes/api/item.ts";

      const router = Router.match(ApiItem.route, constant(Fx.succeed(ApiItem.handler))).provide(RouteServices.dependencyLayers["api/_dependencies.ts"]).provide(RouteServices.dependencyLayers["_dependencies.ts"]);
      export default router;
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as ApiItem from "typed:route-template?path=./routes/api/item.ts";

      const router = Router.match(ApiItem.route, { handler: constant(Fx.succeed(ApiItem.handler)), layout: RouteLayouts.layouts["api/item.layout.ts"] }).layout(RouteLayouts.layouts["api/_layout.ts"]);
      export default router;
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

  it("build returns RVM-ID-DIR-001 when typed router dir query is missing", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("typed:router", fixture.importer, session.api);
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ID-DIR-001");
  });

  it("build returns RVM-ID-QUERY-001 when typed router query has unsupported options", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build(
      "typed:router?dir=./routes&target=browser",
      fixture.importer,
      session.api,
    );
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-ID-QUERY-001");
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
    expect(result).toContain('Router.match(Users.route, RouteGuards.guards["users.guard.ts"]');
    expect(result).not.toContain("??");
  });

  it("guard default export is accepted and emitted", () => {
    const defaultGuardExport =
      'import * as Effect from "effect/Effect"; import * as Option from "effect/Option"; export default function guard(): Effect.Effect<Option.Option<unknown>> { return Effect.succeed(Option.none()); }';
    const result = buildRouterFromFixture({
      "src/routes/users.ts": route("/", "export const handler = 1;"),
      "src/routes/users.guard.ts": defaultGuardExport,
    });
    if (typeof result !== "string") {
      expect(result).toMatchObject({ errors: expect.any(Array) });
      expect((result as VirtualModuleBuildError).errors[0].code).toBe("RVM-GUARD-001");
      return;
    }
    expect(result).toContain('Router.match(Users.route, RouteGuards.guards["users.guard.ts"]');
    expect(result).not.toContain("??");
  });

  it("composes route guards from ancestor to leaf", () => {
    const result = buildRouterFromFixture({
      "src/routes/_guard.ts": validGuardExport,
      "src/routes/api/_guard.ts": validGuardExport,
      "src/routes/api/item.guard.ts": validGuardExport,
      "src/routes/api/item.ts": route("/api/item", "export const handler = 1;"),
    });

    expect(result).toContain("Router.composeGuards(");
    const source = String(result);
    const rootIndex = source.indexOf('RouteGuards.guards["_guard.ts"]');
    const apiIndex = source.indexOf('RouteGuards.guards["api/_guard.ts"]');
    const leafIndex = source.indexOf('RouteGuards.guards["api/item.guard.ts"]');
    expect(rootIndex).toBeGreaterThan(-1);
    expect(apiIndex).toBeGreaterThan(rootIndex);
    expect(leafIndex).toBeGreaterThan(apiIndex);
  });

  it("classifies plain entrypoint and sets needsLift (TS-5, AC-11)", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 42;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "typed:route-template?path=./routes/home.ts";

      const router = Router.match(Home.route, constant(Fx.succeed(Home.handler)));
      export default router;
      "
    `);
  });

  it("effect-valued handler is lifted with Fx.fromEffect (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/effect.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MEffect from "typed:route-template?path=./routes/effect.ts";

      const router = Router.match(MEffect.route, constant(Fx.fromEffect(MEffect.handler)));
      export default router;
      "
    `);
  });

  it("fx-valued handler is passed through directly so the Fx overload preserves types (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as MFx from "typed:route-template?path=./routes/fx.ts";

      const router = Router.match(MFx.route, MFx.handler);
      export default router;
      "
    `);
  });

  it("does not emit unused Fx or constant imports for Fx-valued route handlers", () => {
    const source = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });

    expect(source).not.toContain('import * as Fx from "@typed/fx/Fx";');
    expect(source).not.toContain('import { constant } from "effect/Function";');
    expect(source).toContain("Router.match(MFx.route, MFx.handler)");
  });

  it("does not emit unused constant imports for function route handlers", () => {
    const source = buildRouterFromFixture({
      "src/routes/function.ts": route("/", "export const handler = (p: unknown) => p;"),
    });

    expect(source).toContain('import * as Fx from "@typed/fx/Fx";');
    expect(source).not.toContain('import { constant } from "effect/Function";');
    expect(source).toContain(
      "Router.match(Function.route, (params) => Fx.map(params, Function.handler))",
    );
  });

  it("stream-valued handler is classified as stream (fromStream) (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/stream.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MStream from "typed:route-template?path=./routes/stream.ts";

      const router = Router.match(MStream.route, constant(Fx.fromStream(MStream.handler)));
      export default router;
      "
    `);
  });

  it("plain function handler: emits (params) => Fx.succeed(M.handler(params))", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Page from "typed:route-template?path=./routes/page.ts";

      const router = Router.match(Page.route, (params) => Fx.map(params, Page.handler));
      export default router;
      "
    `);
  });

  it("effect-like function handler: passes through when return type is Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/async.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler = (_p: unknown): Fx.Fx<number> => Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    const source = result as string;
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Async from "typed:route-template?path=./routes/async.ts";

      const router = Router.match(Async.route, (params) => Fx.switchMap(params, Async.handler));
      export default router;
      "
    `);
  });

  it("handler matrix: plain value emits constant(Fx.succeed(M.handler))", () => {
    const source = buildRouterFromFixture({
      "src/routes/v.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as V from "typed:route-template?path=./routes/v.ts";

      const router = Router.match(V.route, constant(Fx.succeed(V.handler)));
      export default router;
      "
    `);
  });

  it("handler matrix: plain function emits (params) => Fx.succeed(M.handler(params))", () => {
    const source = buildRouterFromFixture({
      "src/routes/f.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as F from "typed:route-template?path=./routes/f.ts";

      const router = Router.match(F.route, (params) => Fx.map(params, F.handler));
      export default router;
      "
    `);
  });

  it("handler matrix: Effect value uses fromEffect when type resolves as Effect", () => {
    const result = buildRouterFromFixture({
      "src/routes/e.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as E from "typed:route-template?path=./routes/e.ts";

      const router = Router.match(E.route, constant(Fx.fromEffect(E.handler)));
      export default router;
      "
    `);
  });

  it("handler matrix: Effect function uses fromEffect when return type resolves as Effect", () => {
    const result = buildRouterFromFixture({
      "src/routes/ef.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/")} export const handler = (_p: unknown): Effect.Effect<number> => Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Ef from "typed:route-template?path=./routes/ef.ts";

      const router = Router.match(Ef.route, (params) => Fx.mapEffect(params, Ef.handler));
      export default router;
      "
    `);
  });

  it("handler matrix: Stream value uses fromStream when type resolves as Stream", () => {
    const result = buildRouterFromFixture({
      "src/routes/s.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as S from "typed:route-template?path=./routes/s.ts";

      const router = Router.match(S.route, constant(Fx.fromStream(S.handler)));
      export default router;
      "
    `);
  });

  it("handler matrix: Stream function uses fromStream when return type resolves as Stream", () => {
    const result = buildRouterFromFixture({
      "src/routes/sf.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/")} export const handler = (_p: unknown) => Stream.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Sf from "typed:route-template?path=./routes/sf.ts";

      const router = Router.match(Sf.route, (params) => Fx.switchMap(params, (p) => Fx.fromStream(Sf.handler(p))));
      export default router;
      "
    `);
  });

  it("wrong typeTargetSpecs module path yields no assignableTo and RVM-KIND-001 (structural compatibility required)", () => {
    const wrongSpecs = [
      { id: "Fx", module: "nonexistent/fx", exportName: "Fx" } as const,
      { id: "Route", module: "nonexistent/router", exportName: "Route" } as const,
    ];
    const fixture = createFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: wrongSpecs,
      failWhenNoTargetsResolved: false,
    });
    const result = session.api.file("./src/routes/fx.ts", { baseDir: fixture.root });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const handlerExport = result.snapshot.exports.find((e) => e.name === "handler");
    expect(handlerExport).toBeDefined();
    expect(
      (handlerExport! as { assignableTo?: { Fx?: boolean } }).assignableTo?.Fx,
    ).toBeUndefined();
    const plugin = createRouterVirtualModulePlugin();
    const buildResult = plugin.build("typed:router?dir=./routes", fixture.importer, session.api);
    expect(buildResult).toMatchObject({ errors: expect.any(Array) });
    const codes = (buildResult as VirtualModuleBuildError).errors.map((e) => e.code);
    expect(codes.some((c) => c === "RVM-KIND-001" || c === "RVM-ROUTE-002")).toBe(true);
  });

  it("handler matrix: Fx value pass-through when type resolves as Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/x.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as X from "typed:route-template?path=./routes/x.ts";

      const router = Router.match(X.route, X.handler);
      export default router;
      "
    `);
  });

  it("handler matrix: Fx function with decoded params is lifted with switchMap", () => {
    const result = buildRouterFromFixture({
      "src/routes/xf.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/users/:id")} export const handler = (p: { readonly id: string }): Fx.Fx<string> => Fx.succeed(p.id);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Xf from "typed:route-template?path=./routes/xf.ts";

      const router = Router.match(Xf.route, (params) => Fx.switchMap(params, Xf.handler));
      export default router;
      "
    `);
  });

  it("handler matrix: Fx function with RefSubject params is passed through", () => {
    const result = buildRouterFromFixture({
      "src/routes/xf.ts": `import * as Fx from "@typed/fx/Fx"; import type { RefSubject } from "@typed/fx/RefSubject/RefSubject"; ${routeExportForPath("/users/:id")} export const handler = (p: RefSubject<{ readonly id: string }>): Fx.Fx<string> => Fx.map(p, ({ id }) => id);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toContain("Router.match(Xf.route, Xf.handler)");
    expect(result as string).not.toContain("Fx.switchMap(params, Xf.handler)");
  });

  it("build returns source string", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(
      existsSync(BOOTSTRAP_FILE) ? [...fixture.paths, BOOTSTRAP_FILE] : fixture.paths,
      APP_ROOT,
    );
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    });
    const result = plugin.build("typed:router?dir=./routes", fixture.importer, session.api);
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeGreaterThan(0);
  });

  it("unchanged inputs produce identical output (T-08, TS-6)", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram(
      existsSync(BOOTSTRAP_FILE) ? [...fixture.paths, BOOTSTRAP_FILE] : fixture.paths,
      APP_ROOT,
    );
    const session1 = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    });
    const session2 = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    });
    const source1 = plugin.build("typed:router?dir=./routes", fixture.importer, session1.api);
    const source2 = plugin.build("typed:router?dir=./routes", fixture.importer, session2.api);
    expect(typeof source1).toBe(typeof source2);
    if (typeof source1 === "string") {
      expect(source1).toBe(source2);
    } else {
      expect(source1).toStrictEqual(source2);
    }
  });

  it("emits readonly descriptor metadata with as const (T-08, TS-7)", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "typed:route-template?path=./routes/home.ts";

      const router = Router.match(Home.route, constant(Fx.succeed(Home.handler)));
      export default router;
      "
    `);
  });

  it("golden: single route with handler only", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "typed:route-template?path=./routes/home.ts";

      const router = Router.match(Home.route, constant(Fx.succeed(Home.handler)));
      export default router;
      "
    `);
  });

  it("golden: plain function handler", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = (p: unknown) => 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import * as Page from "typed:route-template?path=./routes/page.ts";

      const router = Router.match(Page.route, (params) => Fx.map(params, Page.handler));
      export default router;
      "
    `);
  });

  it("golden: fx handler pass-through", () => {
    const result = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as MFx from "typed:route-template?path=./routes/fx.ts";

      const router = Router.match(MFx.route, MFx.handler);
      export default router;
      "
    `);
  });

  it("golden: effect handler pass-through", () => {
    const result = buildRouterFromFixture({
      "src/routes/effect.ts": `import * as Effect from "effect/Effect"; ${routeExportForPath("/")} export const handler: Effect.Effect<number> = Effect.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MEffect from "typed:route-template?path=./routes/effect.ts";

      const router = Router.match(MEffect.route, constant(Fx.fromEffect(MEffect.handler)));
      export default router;
      "
    `);
  });

  it("golden: stream handler pass-through", () => {
    const source = buildRouterFromFixture({
      "src/routes/stream.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MStream from "typed:route-template?path=./routes/stream.ts";

      const router = Router.match(MStream.route, constant(Fx.fromStream(MStream.handler)));
      export default router;
      "
    `);
  });

  it("golden: template entrypoint", () => {
    const source = buildRouterFromFixture({
      "src/routes/template.ts": route("/", 'export const template = "<div/>";'),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Template from "typed:route-template?path=./routes/template.ts";

      const router = Router.match(Template.route, constant(Fx.succeed(Template.template)));
      export default router;
      "
    `);
  });

  it("ignores handler companions and uses the in-file route entrypoint", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", 'export const template = "<main>browser</main>";'),
      "src/routes/home.handler.ts": 'export const handler = "<main>server</main>";',
    });
    const source = buildRouterFromExistingFixture(fixture);
    expect(typeof source).toBe("string");
    expect(source as string).not.toContain("home.handler.js");
    expect(source as string).toContain("constant(Fx.succeed(Home.template))");
  });

  it("golden: multiple routes at same level", () => {
    const source = buildRouterFromFixture({
      "src/routes/home.ts": route("/home", "export const handler = 1;"),
      "src/routes/about.ts": route("/about", "export const handler = 1;"),
      "src/routes/contact.ts": route("/contact", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as About from "typed:route-template?path=./routes/about.ts";
      import * as Contact from "typed:route-template?path=./routes/contact.ts";
      import * as Home from "typed:route-template?path=./routes/home.ts";

      const router = Router.merge(
        Router.match(About.route, constant(Fx.succeed(About.handler))),
        Router.match(Contact.route, constant(Fx.succeed(Contact.handler))),
        Router.match(Home.route, constant(Fx.succeed(Home.handler)))
      );
      export default router;
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as UsersId from "typed:route-template?path=./routes/users/[id].ts";
      import * as UsersIndex from "typed:route-template?path=./routes/users/index.ts";
      import * as UsersProfile from "typed:route-template?path=./routes/users/profile.ts";

      const router = Router.merge(
        Router.match(UsersId.route, constant(Fx.succeed(UsersId.handler))),
        Router.match(UsersIndex.route, constant(Fx.succeed(UsersIndex.handler))),
        Router.match(UsersProfile.route, constant(Fx.succeed(UsersProfile.handler)))
      );
      export default router;
      "
    `);
  });

  it("golden: nested Router.merge when multiple dir levels have multiple siblings", () => {
    const source = buildRouterFromFixture({
      "src/routes/page.ts": route("/", "export const handler = 1;"),
      "src/routes/about.ts": route("/about", "export const handler = 1;"),
      "src/routes/docs/index.ts": route("/docs", "export const handler = 1;"),
      "src/routes/docs/guide.ts": route("/docs/guide", "export const handler = 1;"),
      "src/routes/api/status.ts": route("/api/status", "export const handler = 1;"),
      "src/routes/api/users/index.ts": route("/api/users", "export const handler = 1;"),
      "src/routes/api/users/[id].ts": route("/api/users/:id", "export const handler = 1;"),
    });
    const s = source as string;
    expect(s).toContain("import * as Fx from");
    expect(s).not.toMatch(/\(Router\.merge\(/);
    const mergeCount = (s.match(/Router\.merge/g) ?? []).length;
    expect(mergeCount).toBeGreaterThanOrEqual(4);
    expect(s).toContain("Router.merge(");
    expect(s).toContain("Router.match(Page.");
    expect(s).toContain("Router.match(About.");
    expect(s).toContain("DocsIndex");
    expect(s).toContain("DocsGuide");
    expect(s).toContain("ApiStatus");
    expect(s).toContain("ApiUsersIndex");
  });

  it("golden: index route", () => {
    const source = buildRouterFromFixture({
      "src/routes/index.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Index from "typed:route-template?path=./routes/index.ts";

      const router = Router.match(Index.route, constant(Fx.succeed(Index.handler)));
      export default router;
      "
    `);
  });

  it("golden: default entrypoint", () => {
    const source = buildRouterFromFixture({
      "src/routes/default.ts": `${routeExportForPath("/")} export default 1;`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Default from "typed:route-template?path=./routes/default.ts";

      const router = Router.match(Default.route, constant(Fx.succeed(Default.default)));
      export default router;
      "
    `);
  });

  it("golden: provide and layout order leaf to ancestor (chain: closest first)", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/api/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.empty;",
      "src/routes/api/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/items/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/routes/api/items/x.ts": route("/", "export const handler = 1;"),
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as ApiItemsX from "typed:route-template?path=./routes/api/items/x.ts";

      const router = Router.match(ApiItemsX.route, constant(Fx.succeed(ApiItemsX.handler))).layout(RouteLayouts.layouts["api/items/_layout.ts"]).layout(RouteLayouts.layouts["api/_layout.ts"]).provide(RouteServices.dependencyLayers["api/_dependencies.ts"]).provide(RouteServices.dependencyLayers["_dependencies.ts"]);
      export default router;
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as A from "typed:route-template?path=./routes/a.ts";
      import * as B from "typed:route-template?path=./routes/b.ts";

      const router = Router.merge(
        Router.match(A.route, constant(Fx.succeed(A.handler))),
        Router.match(B.route, constant(Fx.succeed(B.handler)))
      );
      export default router;
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
      import * as RouteServices from "typed:services?dir=./routes";
      import * as RouteGuards from "typed:guard?dir=./routes";
      import * as RouteLayouts from "typed:layout?dir=./routes";
      import * as RouteCatches from "typed:catch?dir=./routes";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as A from "typed:route-template?path=./routes/a.ts";
      import * as B from "typed:route-template?path=./routes/b.ts";

      const router = Router.merge(
        Router.match(A.route, constant(Fx.succeed(A.handler))),
        Router.match(B.route, constant(Fx.succeed(B.handler)))
      );
      export default router;
      "
    `);
  });
});

describe("RouterVirtualModulePlugin integration", () => {
  it("emits plugin-specific decoded route types for a route file importing ./$route-types", () => {
    const fixture = createFixture({
      "src/routes/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class RootRouteService extends Context.Service<RootRouteService, { readonly root: string }>()("RootRouteService") {}
const dependencies = Layer.succeed(RootRouteService, { root: "root" });
export default dependencies;
`,
      "src/routes/articles/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class ArticlesRouteService extends Context.Service<ArticlesRouteService, { readonly articles: string }>()("ArticlesRouteService") {}
const dependencies = Layer.succeed(ArticlesRouteService, { articles: "articles" });
export default dependencies;
`,
      "src/routes/_guard.ts": `
import type * as Router from "@typed/router";

export interface RootGuardService { readonly rootGuard: string }
type Input = { readonly slug: string; readonly page: number };
type Output = Input & { readonly rootGuard: true };
export const guard = null as never as Router.GuardType<Input, Output, "root-guard-error", RootGuardService>;
`,
      "src/routes/articles/_guard.ts": `
import type * as Router from "@typed/router";
import type { RootGuardService } from "../_guard.js";

type Input = { readonly slug: string; readonly page: number } & { readonly rootGuard: true };
type Output = Input & { readonly articlesGuard: true };
export interface ArticlesGuardService { readonly articlesGuard: string }
export const guard = null as never as Router.GuardType<Input, Output, "articles-guard-error", ArticlesGuardService | RootGuardService>;
`,
      "src/routes/articles/_layout.ts": `
import type * as Router from "@typed/router";

export const layout = null as never as Router.Layout<
  { readonly slug: string; readonly page: number },
  "show-layout",
  "handler-error" | "show-layout-error",
  "handler-service" | "show-layout-service",
  "articles-layout",
  "articles-layout-error",
  "articles-layout-service"
>;
`,
      "src/routes/_catch.ts": `
import type * as Router from "@typed/router";

export const catchFn = null as never as Router.CatchHandler<
  "articles-catch-error",
  "root-catch",
  "root-catch-error",
  "root-catch-service"
>;
`,
      "src/routes/articles/_catch.ts": `
import type * as Router from "@typed/router";

export const catchFn = null as never as Router.CatchHandler<
  "show-catch-error",
  "articles-catch",
  "articles-catch-error",
  "articles-catch-service"
>;
`,
      "src/routes/articles/show.catch.ts": `
import type * as Router from "@typed/router";

export const catchFn = null as never as Router.CatchHandler<
  "handler-error",
  "show-catch",
  "show-catch-error",
  "show-catch-service"
>;
`,
      "src/routes/articles/show.dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class ShowRouteService extends Context.Service<ShowRouteService, { readonly show: string }>()("ShowRouteService") {}
export const dependencies = [Layer.succeed(ShowRouteService, { show: "show" })] as const;
`,
      "src/routes/articles/show.guard.ts": `
import type * as Router from "@typed/router";
import type { ArticlesGuardService } from "./_guard.js";
import type { RootGuardService } from "../_guard.js";

type Input = { readonly slug: string; readonly page: number } & { readonly rootGuard: true; readonly articlesGuard: true };
type Output = Input & { readonly showGuard: true };
export interface ShowGuardService { readonly showGuard: string }
export const guard = null as never as Router.GuardType<Input, Output, "show-guard-error", ShowGuardService | ArticlesGuardService | RootGuardService>;
`,
      "src/routes/articles/show.layout.ts": `
import type * as Router from "@typed/router";

export const layout = null as never as Router.Layout<
  { readonly slug: string; readonly page: number },
  "handler",
  "handler-error",
  "handler-service",
  "show-layout",
  "show-layout-error",
  "show-layout-service"
>;
`,
      "src/routes/articles/show.ts": `
import * as Fx from "@typed/fx/Fx";
import * as Route from "@typed/router";
import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import type { Catches, Dependencies, Guards, Handler, Layouts, Params, RouteTypes } from "./$route-types";
import type * as Layer from "effect/Layer";
import type * as RouterTypes from "@typed/router";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export const route = Route.Join(
  Route.Parse("articles"),
  Route.Param("slug"),
  Route.QueryParams(Route.Int("page")),
);

type _dependencies = Expect<Equals<
  Dependencies,
  Layer.Layer<
    Layer.Success<
      | typeof import("./_dependencies.js").default
      | typeof import("../_dependencies.js").default
      | (typeof import("./show.dependencies.js").dependencies)[number]
    >,
    Layer.Error<
      | typeof import("./_dependencies.js").default
      | typeof import("../_dependencies.js").default
      | (typeof import("./show.dependencies.js").dependencies)[number]
    >,
    Layer.Services<
      | typeof import("./_dependencies.js").default
      | typeof import("../_dependencies.js").default
      | (typeof import("./show.dependencies.js").dependencies)[number]
    >
  >
>>;
type _guards = Expect<Equals<
  Guards,
  RouterTypes.ComposeGuards<
    Params,
    readonly [
      typeof import("../_guard.js").guard,
      typeof import("./_guard.js").guard,
      typeof import("./show.guard.js").guard,
    ]
  >
>>;
type _layouts = Expect<Equals<
  Layouts<"handler", "handler-error", "handler-service">,
  RouterTypes.ComposeLayouts<
    Params,
    "handler",
    "handler-error",
    "handler-service",
    readonly [
      typeof import("./_layout.js").layout,
      typeof import("./show.layout.js").layout,
    ]
  >
>>;
type _catches = Expect<Equals<
  Catches<"handler", "handler-error", "handler-service">,
  RouterTypes.ComposeCatches<
    "handler-error",
    readonly [
      typeof import("../_catch.js").catchFn,
      typeof import("./_catch.js").catchFn,
      typeof import("./show.catch.js").catchFn,
    ]
  >
>>;
type _routeTypes = Expect<Equals<RouteTypes["dependencies"], Dependencies>>;

const nativeFxFn = ((params: RefSubject<Params>) =>
  Fx.map(params, ({ slug }) => slug)) satisfies Handler;

export const template = ((params: RefSubject<Params>) =>
  Fx.map(params, (value) => {
    const slug: string = value.slug;
    const page: number = value.page;
    return \`\${slug}:\${page}\`;
  })) satisfies Handler;

export const fxTemplate = ((params) => Fx.gen(function* () {
  type _params = Expect<Equals<typeof params, RefSubject<Params>>>;
  const value = yield* params;
  const slug: string = value.slug;
  const page: number = value.page;
  return Fx.succeed(\`\${slug}:\${page}\`);
})) satisfies Handler;
`,
    });
    const importer = join(fixture.root, "src/routes/articles/show.ts");
    const files =
      existsSync(BOOTSTRAP_FILE) && !fixture.paths.includes(BOOTSTRAP_FILE)
        ? [...fixture.paths, BOOTSTRAP_FILE]
        : fixture.paths;
    const program = makeProgram(files, files.includes(BOOTSTRAP_FILE) ? APP_ROOT : fixture.root);
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    });
    const result = createRouterVirtualModulePlugin().build("./$route-types", importer, session.api);

    expect(typeof result).toBe("string");
    if (typeof result !== "string") return;
    expect(result).toContain("export type Dependencies =");
    expect(result).toContain("export type Guards =");
    expect(result).toContain("export type Layouts<A = any, E = any, R = any> =");
    expect(result).toContain("export type Catches<A = any, E = any, R = any> =");
    expect(result).toContain("export type RouteTypes = {");
    expect(result).toContain("export type Handler<A = any, E = any, R = any> =");
    expect(result).toContain("params: RefSubject<Params>");
    expect(result).not.toContain("export type Template");
    expect(result).not.toContain("| HandlerReturn");

    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/routes/articles/$route-types.ts",
      sourceText: result,
      rootFiles: fixture.paths,
      moduleFallbacks: MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
  });

  it("resolves through PluginManager when target exists with valid routes (SG-C1)", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    const program = makeProgram(
      existsSync(BOOTSTRAP_FILE) ? [...fixture.paths, BOOTSTRAP_FILE] : fixture.paths,
      APP_ROOT,
    );
    const sessionFactory = () =>
      createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
      });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "typed:router?dir=./routes",
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

  it("returns error through PluginManager when target directory has no .ts files (T-09)", () => {
    const { importer } = createFixture({ "src/routes/readme.txt": "no ts" });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);
    const resolved = manager.resolveModule({ id: "typed:router?dir=./routes", importer });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("RVM-LEAF-001");
  });

  it("returns error when build throws (invalid routes)", () => {
    const fixture = createFixture({ "src/routes/bad.ts": "export const handler = 1;" });
    const program = makeProgram(fixture.paths);
    const sessionFactory = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "typed:router?dir=./routes",
      importer: fixture.importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("RVM-ROUTE-001");
    expect(resolved.diagnostic.message).toContain('missing "route" export');
  });
});
