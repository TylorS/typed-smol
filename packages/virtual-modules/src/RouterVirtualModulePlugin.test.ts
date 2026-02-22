/// <reference types="node" />
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { createTypeInfoApiSession } from "./TypeInfoApi.js";
import { PluginManager } from "./PluginManager.js";
import {
  createRouterVirtualModulePlugin,
  parseRouterVirtualModuleId,
  resolveRouterTargetDirectory,
} from "./RouterVirtualModulePlugin.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-router-"));
  tempDirs.push(dir);
  return dir;
};

const makeProgram = (rootFiles: readonly string[]): ts.Program =>
  ts.createProgram(rootFiles, {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  });

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

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
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const resolved = resolveRouterTargetDirectory("router:./routes", importer);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.targetDirectory.endsWith("/src/routes")).toBe(true);
  });

  it("shouldResolve returns true when target directory exists with .ts files", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    writeFileSync(join(routesDir, "index.ts"), "export {};", "utf8");
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(true);
  });

  it("shouldResolve returns false when directory has no .ts files (AC-9)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    writeFileSync(join(routesDir, "readme.txt"), "no ts files", "utf8");
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(false);
  });

  it("shouldResolve returns false when target directory is missing", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    mkdirSync(srcDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const plugin = createRouterVirtualModulePlugin();
    expect(plugin.shouldResolve("router:./routes", importer)).toBe(false);
  });

  it("build returns deterministic scaffold source", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "users.ts"),
      `
type Route = { readonly _tag: "Route" };
export const route: Route = { _tag: "Route" };
export const handler = 1;
`,
      "utf8",
    );
    writeFileSync(join(routesDir, "users.guard.ts"), `export const guard = true;`, "utf8");
    writeFileSync(join(routesDir, "helper.ts"), `export const helper = "ok";`, "utf8");

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([
      importer,
      join(routesDir, "users.ts"),
      join(routesDir, "users.guard.ts"),
      join(routesDir, "helper.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);

    expect(source).toContain("router virtual module scaffold");
    expect(source).toContain('"filePath": "users.ts"');
    expect(source).toContain("users.guard.ts");
    expect(source).toContain('"guard"');
    expect(source).not.toContain("helper.ts");
    expect(source).toContain("export const routes = [] as const;");
  });

  it("build throws when entrypoint export exists without route export", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    const invalidLeaf = join(routesDir, "invalid.ts");
    writeFileSync(invalidLeaf, `export const handler = "oops";`, "utf8");

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, invalidLeaf]);
    const session = createTypeInfoApiSession({ ts, program });

    expect(() => plugin.build("router:./routes", importer, session.api)).toThrow(/RVM-ROUTE-001/);
  });

  it("composes sibling and directory companions in ancestor->leaf order (TS-4)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(join(routesDir, "users"), { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(join(routesDir, "_guard.ts"), `export const guard = () => true;`, "utf8");
    writeFileSync(join(routesDir, "users", "_guard.ts"), `export const guard = () => true;`, "utf8");
    writeFileSync(
      join(routesDir, "users", "profile.ts"),
      `
type Route = { readonly _tag: "Route" };
export const route: Route = { _tag: "Route" };
export const handler = 1;
`,
      "utf8",
    );
    writeFileSync(
      join(routesDir, "users", "profile.guard.ts"),
      `export const guard = () => true;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([
      importer,
      join(routesDir, "_guard.ts"),
      join(routesDir, "users", "_guard.ts"),
      join(routesDir, "users", "profile.ts"),
      join(routesDir, "users", "profile.guard.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);

    expect(source).toContain('"filePath": "users/profile.ts"');
    const guardStart = source.indexOf('"guard"');
    expect(guardStart).toBeGreaterThan(-1);
    const guardSection = source.slice(guardStart, guardStart + 200);
    expect(guardSection).toContain('"_guard.ts"');
    expect(guardSection).toContain('"users/_guard.ts"');
    expect(guardSection).toContain('"users/profile.guard.ts"');
    expect(guardSection.indexOf('"_guard.ts"')).toBeLessThan(guardSection.indexOf('"users/_guard.ts"'));
    expect(guardSection.indexOf('"users/_guard.ts"')).toBeLessThan(guardSection.indexOf('"users/profile.guard.ts"'));
  });

  it("composes dependencies and layout/catch in ancestor->leaf order (T-06)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(join(routesDir, "api"), { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(join(routesDir, "_dependencies.ts"), `export const deps = [];`, "utf8");
    writeFileSync(join(routesDir, "api", "_layout.ts"), `export const layout = (x: unknown) => x;`, "utf8");
    writeFileSync(
      join(routesDir, "api", "item.ts"),
      `
type Route = { readonly _tag: "Route" };
export const route: Route = { _tag: "Route" };
export const handler = 1;
`,
      "utf8",
    );
    writeFileSync(join(routesDir, "api", "item.catch.ts"), `export const catchFn = () => null;`, "utf8");

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([
      importer,
      join(routesDir, "_dependencies.ts"),
      join(routesDir, "api", "_layout.ts"),
      join(routesDir, "api", "item.ts"),
      join(routesDir, "api", "item.catch.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);

    expect(source).toContain('"filePath": "api/item.ts"');
    const depsSection = source.slice(source.indexOf('"dependencies"'), source.indexOf('"dependencies"') + 150);
    expect(depsSection).toContain('"_dependencies.ts"');
    const layoutSection = source.slice(source.indexOf('"layout"'), source.indexOf('"layout"') + 150);
    expect(layoutSection).toContain('"api/_layout.ts"');
    const catchSection = source.slice(source.indexOf('"catch"'), source.indexOf('"catch"') + 100);
    expect(catchSection).toContain('"api/item.catch.ts"');
  });

  it("build throws when multiple entrypoints are exported", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    const invalidLeaf = join(routesDir, "invalid.ts");
    writeFileSync(
      invalidLeaf,
      `
type Route = { readonly _tag: "Route" };
export const route: Route = { _tag: "Route" };
export const handler = "a";
export const template = "b";
`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, invalidLeaf]);
    const session = createTypeInfoApiSession({ ts, program });

    expect(() => plugin.build("router:./routes", importer, session.api)).toThrow(/RVM-ENTRY-002/);
  });

  it("classifies plain entrypoint and sets needsLift (TS-5, AC-11)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "home.ts"),
      `
type Route = { readonly _tag: "Route" };
export const route: Route = { _tag: "Route" };
export const handler = 42;
`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "home.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);

    expect(source).toContain('"runtimeKind": "plain"');
    expect(source).toContain('"needsLift": true');
  });

  it("classifies effect entrypoint when type mentions Effect (T-07, TS-5)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "effect.ts"),
      `type Route = { _tag: "E" }; export const route: Route = { _tag: "E" }; type EffectHandler = number; export const handler: EffectHandler = 1;`,
      "utf8",
    );
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "effect.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);
    expect(source).toContain('"runtimeKind": "effect"');
  });

  it("classifies fx entrypoint when type mentions Fx (T-07, TS-5)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "fx.ts"),
      `type Route = { _tag: "F" }; export const route: Route = { _tag: "F" }; type FxHandler = number; export const handler: FxHandler = 1;`,
      "utf8",
    );
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "fx.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);
    expect(source).toContain('"runtimeKind": "fx"');
  });

  it("classifies stream entrypoint when type mentions Stream (T-07, TS-5)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "stream.ts"),
      `type Route = { _tag: "S" }; export const route: Route = { _tag: "S" }; type StreamHandler = number; export const handler: StreamHandler = 1;`,
      "utf8",
    );
    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "stream.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);
    expect(source).toContain('"runtimeKind": "stream"');
  });

  it("unchanged inputs produce identical output (T-08, TS-6)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "home.ts"),
      `type Route = { _tag: "Route" }; export const route: Route = { _tag: "Route" }; export const handler = 1;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "home.ts")]);
    const session1 = createTypeInfoApiSession({ ts, program });
    const session2 = createTypeInfoApiSession({ ts, program });
    const source1 = plugin.build("router:./routes", importer, session1.api);
    const source2 = plugin.build("router:./routes", importer, session2.api);

    expect(source1).toBe(source2);
  });

  it("emits readonly descriptor metadata with as const (T-08, TS-7)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "home.ts"),
      `type Route = { _tag: "Route" }; export const route: Route = { _tag: "Route" }; export const handler = 1;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "home.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);

    expect(source).toContain("routeModules = ");
    expect(source).toContain(" as const;");
    expect(source).toContain("routes = [] as const");
  });

  it("golden: build output matches snapshot (TS-6 determinism)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "home.ts"),
      `type Route = { _tag: "Route" }; export const route: Route = { _tag: "Route" }; export const handler = 1;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([importer, join(routesDir, "home.ts")]);
    const session = createTypeInfoApiSession({ ts, program });
    const source = plugin.build("router:./routes", importer, session.api);
    const normalized = source.replace(
      /export const routerDirectory = "[^"]+";/,
      'export const routerDirectory = "<ROUTER_DIR>";',
    );
    expect(normalized).toMatchSnapshot();
  });

  it("detects ambiguous routes and emits diagnostic (TS-9)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "shared.ts"),
      `export type Route = { readonly _tag: "Route" }; export const route: Route = { _tag: "Route" };`,
      "utf8",
    );
    writeFileSync(
      join(routesDir, "a.ts"),
      `import { route } from "./shared"; export { route }; export const handler = 1;`,
      "utf8",
    );
    writeFileSync(
      join(routesDir, "b.ts"),
      `import { route } from "./shared"; export { route }; export const handler = 2;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([
      importer,
      join(routesDir, "shared.ts"),
      join(routesDir, "a.ts"),
      join(routesDir, "b.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });

    expect(() => plugin.build("router:./routes", importer, session.api)).toThrow(/RVM-AMBIGUOUS-001/);
  });

  it("ambiguity diagnostic orders conflict deterministically (T-10, TS-9)", () => {
    const root = createTempDir();
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "shared.ts"),
      `export type Route = { readonly _tag: "Route" }; export const route: Route = { _tag: "Route" };`,
      "utf8",
    );
    writeFileSync(
      join(routesDir, "a.ts"),
      `import { route } from "./shared"; export { route }; export const handler = 1;`,
      "utf8",
    );
    writeFileSync(
      join(routesDir, "b.ts"),
      `import { route } from "./shared"; export { route }; export const handler = 2;`,
      "utf8",
    );

    const plugin = createRouterVirtualModulePlugin();
    const program = makeProgram([
      importer,
      join(routesDir, "shared.ts"),
      join(routesDir, "a.ts"),
      join(routesDir, "b.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });

    try {
      plugin.build("router:./routes", importer, session.api);
      expect.fail("expected build to throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).toMatch(/RVM-AMBIGUOUS-001/);
      expect(message).toContain("a.ts");
      expect(message).toContain("b.ts");
      expect(message.indexOf("a.ts")).toBeLessThan(message.indexOf("b.ts"));
    }
  });
});

describe("RouterVirtualModulePlugin integration", () => {
  it("resolves through PluginManager when target exists with valid routes (SG-C1)", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vm-router-integration-"));
    tempDirs.push(root);
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(
      join(routesDir, "home.ts"),
      `type Route = { _tag: "Route" }; export const route = { _tag: "Route" as const }; export const handler = 1;`,
      "utf8",
    );

    const program = ts.createProgram([importer, join(routesDir, "home.ts")], {
      strict: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    });
    const sessionFactory = () =>
      createTypeInfoApiSession({ ts, program: ts.createProgram([importer, join(routesDir, "home.ts")], program.getCompilerOptions()) });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "router:./routes",
      importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.pluginName).toBe("router-virtual-module");
    expect(resolved.sourceText).toContain("routeModules");
  });

  it("returns unresolved through PluginManager when id does not match (T-09)", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vm-router-integration-"));
    tempDirs.push(root);
    const srcDir = join(root, "src");
    mkdirSync(srcDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const manager = new PluginManager([createRouterVirtualModulePlugin()]);
    const resolved = manager.resolveModule({
      id: "other:something",
      importer,
    });
    expect(resolved.status).toBe("unresolved");
  });

  it("returns unresolved through PluginManager when target directory has no .ts files (T-09)", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vm-router-integration-"));
    tempDirs.push(root);
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    writeFileSync(join(routesDir, "readme.txt"), "no ts", "utf8");
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");

    const manager = new PluginManager([createRouterVirtualModulePlugin()]);
    const resolved = manager.resolveModule({
      id: "router:./routes",
      importer,
    });
    expect(resolved.status).toBe("unresolved");
  });

  it("returns error when build throws (invalid routes)", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vm-router-integration-"));
    tempDirs.push(root);
    const srcDir = join(root, "src");
    const routesDir = join(srcDir, "routes");
    mkdirSync(routesDir, { recursive: true });
    const importer = join(srcDir, "entry.ts");
    writeFileSync(importer, "export {};", "utf8");
    writeFileSync(join(routesDir, "bad.ts"), `export const handler = 1;`, "utf8");

    const program = makeProgram([importer, join(routesDir, "bad.ts")]);
    const sessionFactory = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([createRouterVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "router:./routes",
      importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("plugin-build-threw");
    expect(resolved.diagnostic.message).toContain("RVM-ROUTE-001");
  });
});
