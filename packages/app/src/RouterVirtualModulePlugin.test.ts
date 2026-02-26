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
import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import {
  createRouterVirtualModulePlugin,
  parseRouterVirtualModuleId,
  resolveRouterTargetDirectory,
  ROUTER_TYPE_TARGET_SPECS,
} from "./index.js";
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
  return plugin.build("router:./routes", fixture.importer, session.api);
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
  effect: join(NM, "effect", "dist", "index.d.ts"),
  "effect/Effect": join(NM, "effect", "dist", "Effect.d.ts"),
  "effect/Stream": join(NM, "effect", "dist", "Stream.d.ts"),
  "effect/Layer": join(NM, "effect", "dist", "Layer.d.ts"),
  "effect/ServiceMap": join(NM, "effect", "dist", "ServiceMap.d.ts"),
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
  it("parses router id with ./ prefix", () => {
    const parsed = parseRouterVirtualModuleId("router:./routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
  });

  it("rejects ids that do not use the router prefix", () => {
    const parsed = parseRouterVirtualModuleId("virtual:./routes");
    expect(parsed.ok).toBe(false);
  });

  it("accepts router:routes without ./ prefix (normalized to ./routes)", () => {
    const parsed = parseRouterVirtualModuleId("router:routes");
    expect(parsed).toEqual({ ok: true, relativeDirectory: "./routes" });
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Users from "./routes/users.js";

      const router = Router.match(Users.route, constant(Fx.succeed(Users.handler)));
      export default router;
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
    expect(source).toContain('import * as Layer from "effect/Layer"');
    expect(source).toContain("Router.normalizeDependencyInput(Dependencies.default)");
    expect(source).toContain(".provide(");
  });

  it("supports Layer.mergeAll in _dependencies default export", () => {
    const source = buildRouterFromFixture({
      "src/routes/_dependencies.ts":
        "import * as Layer from 'effect/Layer'; export default Layer.mergeAll(Layer.empty, Layer.empty);",
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
    expect(typeof source).toBe("string");
    expect(source).toContain('import * as Layer from "effect/Layer"');
    expect(source).toContain(".provide(Dependencies.default)");
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Layer from "effect/Layer";
      import * as UsersProfile from "./routes/users/profile.js";
      import * as Dependencies from "./routes/_dependencies.js";
      import * as UsersProfiledependencies from "./routes/users/profile.dependencies.js";

      const router = Router.match(UsersProfile.route, { handler: constant(Fx.succeed(UsersProfile.handler)), dependencies: UsersProfiledependencies.dependencies }).provide(Router.normalizeDependencyInput(Dependencies.default));
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
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Effect from "effect/Effect";
      import * as Cause from "effect/Cause";
      import * as Result from "effect/Result";
      import * as Layer from "effect/Layer";
      import * as ApiItem from "./routes/api/item.js";
      import * as Dependencies from "./routes/_dependencies.js";
      import * as ApiLayout from "./routes/api/_layout.js";
      import * as ApiItemcatch from "./routes/api/item.catch.js";

      const router = Router.match(ApiItem.route, { handler: constant(Fx.succeed(ApiItem.handler)), catch: (causeRef) => Fx.flatMap(causeRef, (cause) => Result.match(Cause.findFail(cause), { onFailure: (c) => Fx.fromEffect(Effect.failCause(c)), onSuccess: ({ error: e }) => Fx.succeed(ApiItemcatch.catchFn(e)) })) }).layout(ApiLayout.layout).provide(Dependencies.default);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Layer from "effect/Layer";
      import * as Page from "./routes/page.js";
      import * as Pagedependencies from "./routes/page.dependencies.js";
      import * as Pagelayout from "./routes/page.layout.js";

      const router = Router.match(Page.route, { handler: constant(Fx.succeed(Page.handler)), dependencies: Pagedependencies.dependencies, layout: Pagelayout.layout });
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Layer from "effect/Layer";
      import * as UsersProfile from "./routes/users/profile.js";
      import * as Dependencies from "./routes/_dependencies.js";
      import * as UsersProfiledependencies from "./routes/users/profile.dependencies.js";

      const router = Router.match(UsersProfile.route, { handler: constant(Fx.succeed(UsersProfile.handler)), dependencies: UsersProfiledependencies.dependencies }).provide(Dependencies.default);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Layer from "effect/Layer";
      import * as ApiItem from "./routes/api/item.js";
      import * as ApiDependencies from "./routes/api/_dependencies.js";
      import * as Dependencies from "./routes/_dependencies.js";

      const router = Router.match(ApiItem.route, constant(Fx.succeed(ApiItem.handler))).provide(ApiDependencies.default).provide(Dependencies.default);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as ApiItem from "./routes/api/item.js";
      import * as ApiLayout from "./routes/api/_layout.js";
      import * as ApiItemlayout from "./routes/api/item.layout.js";

      const router = Router.match(ApiItem.route, { handler: constant(Fx.succeed(ApiItem.handler)), layout: ApiItemlayout.layout }).layout(ApiLayout.layout);
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

  it("build returns RVM-ID-001 when virtual module id is invalid (e.g. empty relative path)", () => {
    const fixture = createFixture({
      "src/routes/home.ts": route("/", "export const handler = 1;"),
    });
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "./routes/home.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MEffect from "./routes/effect.js";

      const router = Router.match(MEffect.route, constant(Fx.fromEffect(MEffect.handler)));
      export default router;
      "
    `);
  });

  it("fx-valued handler is passed through (constant(ref)) since already Fx (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/fx.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler: Fx.Fx<number> = Fx.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MFx from "./routes/fx.js";

      const router = Router.match(MFx.route, constant(MFx.handler));
      export default router;
      "
    `);
  });

  it("stream-valued handler is classified as stream (fromStream) (T-07, TS-5)", () => {
    const source = buildRouterFromFixture({
      "src/routes/stream.ts": `import * as Stream from "effect/Stream"; ${routeExportForPath("/")} export const handler = Stream.succeed(1);`,
    });
    expect(source).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MStream from "./routes/stream.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Page from "./routes/page.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Async from "./routes/async.js";

      const router = Router.match(Async.route, Async.handler);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as V from "./routes/v.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as F from "./routes/f.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as E from "./routes/e.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Ef from "./routes/ef.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as S from "./routes/s.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Sf from "./routes/sf.js";

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
    expect(handlerExport!.assignableTo?.Fx).toBeUndefined();
    const plugin = createRouterVirtualModulePlugin();
    const buildResult = plugin.build("router:./routes", fixture.importer, session.api);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as X from "./routes/x.js";

      const router = Router.match(X.route, constant(X.handler));
      export default router;
      "
    `);
  });

  it("handler matrix: Fx function pass-through when return type resolves as Fx", () => {
    const result = buildRouterFromFixture({
      "src/routes/xf.ts": `import * as Fx from "@typed/fx/Fx"; ${routeExportForPath("/")} export const handler = (_p: unknown): Fx.Fx<number> => Fx.succeed(1);`,
    });
    expect(typeof result).toBe("string");
    expect(result as string).toMatchInlineSnapshot(`
      "import * as Router from "@typed/router";
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Xf from "./routes/xf.js";

      const router = Router.match(Xf.route, Xf.handler);
      export default router;
      "
    `);
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
    const result = plugin.build("router:./routes", fixture.importer, session.api);
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
    const source1 = plugin.build("router:./routes", fixture.importer, session1.api);
    const source2 = plugin.build("router:./routes", fixture.importer, session2.api);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "./routes/home.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Home from "./routes/home.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Page from "./routes/page.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MFx from "./routes/fx.js";

      const router = Router.match(MFx.route, constant(MFx.handler));
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MEffect from "./routes/effect.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as MStream from "./routes/stream.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Template from "./routes/template.js";

      const router = Router.match(Template.route, constant(Fx.succeed(Template.template)));
      export default router;
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as About from "./routes/about.js";
      import * as Contact from "./routes/contact.js";
      import * as Home from "./routes/home.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as UsersId from "./routes/users/[id].js";
      import * as UsersIndex from "./routes/users/index.js";
      import * as UsersProfile from "./routes/users/profile.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Index from "./routes/index.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Default from "./routes/default.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as Layer from "effect/Layer";
      import * as ApiItemsX from "./routes/api/items/x.js";
      import * as ApiDependencies from "./routes/api/_dependencies.js";
      import * as Dependencies from "./routes/_dependencies.js";
      import * as ApiItemsLayout from "./routes/api/items/_layout.js";
      import * as ApiLayout from "./routes/api/_layout.js";

      const router = Router.match(ApiItemsX.route, constant(Fx.succeed(ApiItemsX.handler))).layout(ApiItemsLayout.layout).layout(ApiLayout.layout).provide(ApiDependencies.default).provide(Dependencies.default);
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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as A from "./routes/a.js";
      import * as B from "./routes/b.js";

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
      import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as A from "./routes/a.js";
      import * as B from "./routes/b.js";

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
