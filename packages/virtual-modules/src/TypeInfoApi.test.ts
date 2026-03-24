/// <reference types="node" />
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import type { TypeNode } from "./types.js";
import {
  createTypeInfoApiSession,
  createTypeTargetBootstrapContent,
  resolveTypeTargetsFromSpecs,
  serializeTypeForTest,
} from "./TypeInfoApi.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-typeinfo-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("createTypeTargetBootstrapContent", () => {
  it("generates imports for each unique module in specs", () => {
    const specs = [
      { id: "Effect", module: "effect/Effect", exportName: "Effect" },
      { id: "Route", module: "@typed/router", exportName: "Route" },
      { id: "Schema", module: "effect/Schema", exportName: "Schema" },
    ];
    const content = createTypeTargetBootstrapContent(specs);
    expect(content).toContain('import * as _effect_Effect from "effect/Effect";');
    expect(content).toContain('import * as __typed_router from "@typed/router";');
    expect(content).toContain('import * as _effect_Schema from "effect/Schema";');
    expect(content).toContain("export {};");
  });

  it("dedupes modules when multiple specs share the same module", () => {
    const specs = [
      { id: "A", module: "pkg/mod", exportName: "A" },
      { id: "B", module: "pkg/mod", exportName: "B" },
    ];
    const content = createTypeTargetBootstrapContent(specs);
    const importCount = (content.match(/import \* as/g) ?? []).length;
    expect(importCount).toBe(1);
  });
});

describe("resolveTypeTargetsFromSpecs with typeMember", () => {
  it("resolves typeMember for generic base (Route.Any) and assignableTo passes for instantiation", () => {
    const dir = createTempDir();
    const routeMod = join(dir, "route.ts");
    const bootstrap = join(dir, "bootstrap.ts");
    const main = join(dir, "main.ts");
    writeFileSync(
      routeMod,
      `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
      "utf8",
    );
    writeFileSync(bootstrap, `import * as Route from "./route.js"; void Route; export {};`, "utf8");
    writeFileSync(
      main,
      `import * as Route from "./route.js"; export const r = Route.Parse("/status");`,
      "utf8",
    );

    const program = makeProgram([bootstrap, main]);
    const specs = [
      { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
    ] as const;
    const targets = resolveTypeTargetsFromSpecs(program, ts, specs);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.id).toBe("Route");

    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: specs,
      failWhenNoTargetsResolved: false,
    });
    const result = session.api.file("./main.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const rExport = result.snapshot.exports.find((e) => e.name === "r");
    expect(rExport).toBeDefined();
    expect(session.api.isAssignableTo(rExport!.type, "Route")).toBe(true);
  });
});

const makeProgram = (rootFiles: readonly string[]): ts.Program =>
  ts.createProgram(rootFiles, {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  });

describe("createTypeInfoApiSession", () => {
  it("serializes rich structural type information", () => {
    const dir = createTempDir();
    const filePath = join(dir, "types.ts");
    writeFileSync(
      filePath,
      `
export type U = string | number;
export interface Box { readonly value: U; optional?: number }
export const tuple = [1, "x"] as const;
export const fn = (input: Box): U => input.value;
`,
      "utf8",
    );

    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./types.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snapshot = result.snapshot;
    const byName = new Map(snapshot.exports.map((entry) => [entry.name, entry]));
    expect(byName.get("U")?.type.kind).toBe("union");
    expect(byName.get("tuple")?.type.kind).toBe("tuple");
    expect(byName.get("fn")?.type.kind).toBe("function");
    expect(byName.get("Box")?.type.kind).toBe("object");
  });

  it("supports relativeGlobs directory queries and watch descriptors", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "a.ts"), `export const a = 1;`, "utf8");
    writeFileSync(join(dir, "b.ts"), `export const b = 2;`, "utf8");
    mkdirSync(join(dir, "nested"), { recursive: true });
    writeFileSync(join(dir, "nested", "nested.ts"), `export const nested = 3;`, "utf8");

    const program = makeProgram([
      join(dir, "a.ts"),
      join(dir, "b.ts"),
      join(dir, "nested", "nested.ts"),
    ]);
    const session = createTypeInfoApiSession({ ts, program });

    const nonRecursive = session.api.directory("*.ts", {
      baseDir: dir,
      recursive: false,
      watch: true,
    });
    const recursive = session.api.directory("*.ts", {
      baseDir: dir,
      recursive: true,
      watch: true,
    });

    expect(nonRecursive.length).toBe(2);
    expect(recursive.length).toBeGreaterThan(nonRecursive.length);

    const dependencies = session.consumeDependencies();
    expect(dependencies.some((descriptor) => descriptor.type === "glob")).toBe(true);
  });

  it("returns path-escapes-base when relativePath escapes baseDir", () => {
    const dir = createTempDir();
    const filePath = join(dir, "types.ts");
    writeFileSync(filePath, "export const x = 1;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });

    const result = session.api.file("../../../other/types.ts", { baseDir: dir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("path-escapes-base");
  });

  it("returns path-escapes-base when path resolves via symlink outside baseDir", () => {
    const baseDir = createTempDir();
    const outsideDir = createTempDir();
    const outsideFile = join(outsideDir, "outside.ts");
    writeFileSync(outsideFile, "export const x = 1;", "utf8");
    const linkInsideBase = join(baseDir, "link-to-outside");
    let symlinkCreated = false;
    try {
      symlinkSync(outsideDir, linkInsideBase);
      symlinkCreated = true;
    } catch {
      // Symlinks may require privileges on some platforms (e.g. Windows); skip if unavailable
    }
    if (!symlinkCreated) return;

    const program = makeProgram([join(baseDir, "dummy.ts")]);
    writeFileSync(join(baseDir, "dummy.ts"), "export const d = 1;", "utf8");
    const session = createTypeInfoApiSession({ ts, program });

    const result = session.api.file("./link-to-outside/outside.ts", { baseDir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("path-escapes-base");
  });

  it("returns file-not-in-program when file is not in the program", () => {
    const dir = createTempDir();
    const inProgram = join(dir, "in-program.ts");
    const notInProgram = join(dir, "not-in-program.ts");
    writeFileSync(inProgram, "export const a = 1;", "utf8");
    writeFileSync(notInProgram, "export const b = 2;", "utf8");
    const program = makeProgram([inProgram]);

    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./not-in-program.ts", { baseDir: dir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("file-not-in-program");
  });

  it("returns empty array from directory() when baseDir is invalid", () => {
    const dir = createTempDir();
    const filePath = join(dir, "types.ts");
    writeFileSync(filePath, "export const x = 1;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });

    const emptyBase = session.api.directory("*.ts", { baseDir: "", recursive: false });
    expect(emptyBase).toEqual([]);
  });

  it("caches directory() results: identical calls return the same array reference", () => {
    const dir = createTempDir();
    const filePath = join(dir, "types.ts");
    writeFileSync(filePath, "export const x = 1;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });

    const first = session.api.directory("*.ts", { baseDir: dir, recursive: false });
    const second = session.api.directory("*.ts", { baseDir: dir, recursive: false });
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it("directory() cache is keyed by baseDir and globs: different query yields different result", () => {
    const dir = createTempDir();
    const tsPath = join(dir, "a.ts");
    writeFileSync(tsPath, "export const x = 1;", "utf8");
    const program = makeProgram([tsPath]);
    const session = createTypeInfoApiSession({ ts, program });

    const withTs = session.api.directory("*.ts", { baseDir: dir, recursive: false });
    const withTsx = session.api.directory("*.tsx", { baseDir: dir, recursive: false });
    expect(withTs).not.toBe(withTsx);
    expect(withTs.length).toBeGreaterThan(0);
    expect(withTsx.length).toBe(0);
  });

  it("returns invalid-input for empty baseDir or invalid relativePath", () => {
    const dir = createTempDir();
    const filePath = join(dir, "types.ts");
    writeFileSync(filePath, "export const x = 1;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });

    const emptyBase = session.api.file("./types.ts", { baseDir: "" });
    expect(emptyBase.ok).toBe(false);
    if (emptyBase.ok) return;
    expect(emptyBase.error).toBe("invalid-input");

    const nullByte = session.api.file("types.ts\0", { baseDir: dir });
    expect(nullByte.ok).toBe(false);
    if (nullByte.ok) return;
    expect(nullByte.error).toBe("invalid-input");
  });

  it("resolves re-exports to the type from the target file", () => {
    const dir = createTempDir();
    const routeShape = `export const route = { ast: null, path: "/", paramsSchema: null, pathSchema: null, querySchema: null };`;
    const bPath = join(dir, "b.ts");
    const aPath = join(dir, "a.ts");
    writeFileSync(bPath, routeShape, "utf8");
    writeFileSync(aPath, 'export { route } from "./b";', "utf8");
    const program = makeProgram([aPath, bPath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./a.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const routeExport = result.snapshot.exports.find((e) => e.name === "route");
    expect(routeExport).toBeDefined();
    expect(routeExport!.type.kind).toBe("object");
    const obj = routeExport!.type as {
      kind: "object";
      properties: ReadonlyArray<{ name: string }>;
    };
    const names = new Set(obj.properties.map((p) => p.name));
    expect(names.has("ast")).toBe(true);
    expect(names.has("path")).toBe(true);
    expect(names.has("paramsSchema")).toBe(true);
    expect(names.has("pathSchema")).toBe(true);
    expect(names.has("querySchema")).toBe(true);
  });

  it("resolveExport returns export by name from a file", () => {
    const dir = createTempDir();
    const filePath = join(dir, "mod.ts");
    writeFileSync(filePath, "export const foo = 1; export type Bar = string;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });

    const foo = session.api.resolveExport(dir, "./mod.ts", "foo");
    expect(foo).toBeDefined();
    expect(foo!.name).toBe("foo");
    expect(["primitive", "literal"]).toContain(foo!.type.kind);

    const bar = session.api.resolveExport(dir, "./mod.ts", "Bar");
    expect(bar).toBeDefined();
    expect(bar!.name).toBe("Bar");

    const missing = session.api.resolveExport(dir, "./mod.ts", "nonexistent");
    expect(missing).toBeUndefined();
  });

  it("includes imports in file snapshot when present", () => {
    const dir = createTempDir();
    const filePath = join(dir, "mod.ts");
    writeFileSync(
      filePath,
      'import { a, b } from "./other"; import * as ns from "./ns"; export const x = a;',
      "utf8",
    );
    const otherPath = join(dir, "other.ts");
    writeFileSync(otherPath, "export const a = 1; export const b = 2;", "utf8");
    const nsPath = join(dir, "ns.ts");
    writeFileSync(nsPath, "export const y = 3;", "utf8");
    const program = makeProgram([filePath, otherPath, nsPath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./mod.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.imports).toBeDefined();
    expect(result.snapshot.imports!.length).toBe(2);
    const named = result.snapshot.imports!.find((i) => i.importedNames);
    expect(named?.moduleSpecifier).toBe("./other");
    expect(named?.importedNames).toEqual(["a", "b"]);
    const ns = result.snapshot.imports!.find((i) => i.namespaceImport);
    expect(ns?.moduleSpecifier).toBe("./ns");
    expect(ns?.namespaceImport).toBe("ns");
  });

  it("accepts typeTargetSpecs and resolves them for assignableTo", () => {
    const dir = createTempDir();
    const filePath = join(dir, "mod.ts");
    writeFileSync(filePath, "export const x: number = 1;", "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: [{ id: "Num", module: "effect/Number", exportName: "Number" }],
      failWhenNoTargetsResolved: false,
    });
    const result = session.api.file("./mod.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const xExport = result.snapshot.exports.find((e) => e.name === "x");
    expect(xExport).toBeDefined();
    expect(xExport!.type.kind).toBe("primitive");
  });

  describe("isAssignableTo dynamic API", () => {
    it("returns true for direct assignability check", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js"; export const r = Route.Parse("/status");`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const routeExport = result.snapshot.exports.find((e) => e.name === "r");
      expect(routeExport).toBeDefined();
      expect(session.api.isAssignableTo(routeExport!.type, "Route")).toBe(true);
    });

    it("returns false for non-matching target", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js"; export const r = Route.Parse("/status"); export const n: number = 1;`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const nExport = result.snapshot.exports.find((e) => e.name === "n");
      expect(nExport).toBeDefined();
      expect(session.api.isAssignableTo(nExport!.type, "Route")).toBe(false);
    });

    it("returns true for projected check (returnType)", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js";
export const r = Route.Parse("/status");
export function getRoute(): Route.Route<string, any> { return r; }`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "getRoute");
      expect(fnExport).toBeDefined();
      expect(session.api.isAssignableTo(fnExport!.type, "Route", [{ kind: "returnType" }])).toBe(
        true,
      );
    });

    it("returns true for sub-node passed directly", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js";
export function getRoute(): Route.Route<string, any> { return Route.Parse("/status"); }`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "getRoute");
      expect(fnExport).toBeDefined();
      expect(fnExport!.type.kind).toBe("function");
      const fnNode = fnExport!.type as { kind: "function"; returnType: TypeNode };
      expect(session.api.isAssignableTo(fnNode.returnType, "Route")).toBe(true);
    });

    it("returns false for projection on wrong shape", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js"; export const r = Route.Parse("/status");`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const rExport = result.snapshot.exports.find((e) => e.name === "r");
      expect(rExport).toBeDefined();
      expect(session.api.isAssignableTo(rExport!.type, "Route", [{ kind: "returnType" }])).toBe(
        false,
      );
    });

    it("returns false for unregistered node", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js"; export const r = Route.Parse("/status");`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const unregisteredNode = { kind: "primitive" as const, text: "number" } as TypeNode;
      expect(session.api.isAssignableTo(unregisteredNode, "Route")).toBe(false);
    });

    it("ensure passes and continues chain - (...) => Effect<Option<*>> pattern", () => {
      const dir = createTempDir();
      const effectMod = join(dir, "effect.ts");
      const optionMod = join(dir, "option.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        effectMod,
        `
export interface Effect<A, E, R> { readonly _tag: "Effect"; readonly _A: A; readonly _E: E; readonly _R: R }
export namespace Effect {
  export type Any = Effect<any, any, any>;
}
`,
        "utf8",
      );
      writeFileSync(
        optionMod,
        `
export interface Option<A> { readonly _tag: "Option"; readonly _A: A }
export namespace Option {
  export type Any = Option<any>;
}
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Effect from "./effect.js"; import * as Option from "./option.js"; void Effect; void Option; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Effect from "./effect.js"; import * as Option from "./option.js";
export function fn(): Effect.Effect<Option.Option<string>, never, never> {
  return {} as Effect.Effect<Option.Option<string>, never, never>;
}`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Effect", module: "./effect.js", exportName: "Effect", typeMember: "Any" },
        { id: "Option", module: "./option.js", exportName: "Option", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "fn");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Option", [
          { kind: "returnType" },
          { kind: "ensure", targetId: "Effect" },
          { kind: "typeArg", index: 0 },
        ]),
      ).toBe(true);
    });

    it("ensure fails when return type is not Effect", () => {
      const dir = createTempDir();
      const effectMod = join(dir, "effect.ts");
      const optionMod = join(dir, "option.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        effectMod,
        `
export interface Effect<A, E, R> { readonly _tag: "Effect"; readonly _A: A; readonly _E: E; readonly _R: R }
export namespace Effect { export type Any = Effect<any, any, any>; }
`,
        "utf8",
      );
      writeFileSync(
        optionMod,
        `
export interface Option<A> { readonly _tag: "Option"; readonly _A: A }
export namespace Option { export type Any = Option<any>; }
`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Effect from "./effect.js"; import * as Option from "./option.js"; void Effect; void Option; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Option from "./option.js";
export function fn(): Option.Option<string> {
  return {} as Option.Option<string>;
}`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Effect", module: "./effect.js", exportName: "Effect", typeMember: "Any" },
        { id: "Option", module: "./option.js", exportName: "Option", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "fn");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Option", [
          { kind: "returnType" },
          { kind: "ensure", targetId: "Effect" },
          { kind: "typeArg", index: 0 },
        ]),
      ).toBe(false);
    });

    it("ensure with unknown targetId returns false", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route { export type Any = Route<any, any>; export const Parse = (p: string) => ({} as Route<any, any>); }`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js";
export function getRoute(): Route.Route<string, any> { return Route.Parse("/") as Route.Route<string, any>; }`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "getRoute");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Route", [
          { kind: "returnType" },
          { kind: "ensure", targetId: "UnknownTarget" },
        ]),
      ).toBe(false);
    });

    it("predicate on node kind passes", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route { export type Any = Route<any, any>; export const Parse = (p: string) => ({} as Route<any, any>); }`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js";
export function getRoute(): Route.Route<string, any> { return Route.Parse("/") as Route.Route<string, any>; }`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "getRoute");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Route", [
          { kind: "returnType" },
          { kind: "predicate", fn: (n) => n.kind === "reference" || n.kind === "object" },
        ]),
      ).toBe(true);
    });

    it("predicate returns false - whole check fails", () => {
      const dir = createTempDir();
      const routeMod = join(dir, "route.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        routeMod,
        `export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route { export type Any = Route<any, any>; export const Parse = (p: string) => ({} as Route<any, any>); }`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Route from "./route.js"; void Route; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Route from "./route.js";
export function getRoute(): Route.Route<string, any> { return Route.Parse("/") as Route.Route<string, any>; }`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "getRoute");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Route", [
          { kind: "returnType" },
          { kind: "predicate", fn: () => false },
        ]),
      ).toBe(false);
    });

    it("predicate with typeArguments cardinality check", () => {
      const dir = createTempDir();
      const effectMod = join(dir, "effect.ts");
      const bootstrap = join(dir, "bootstrap.ts");
      const main = join(dir, "main.ts");
      writeFileSync(
        effectMod,
        `export interface Effect<A, E, R> { readonly _tag: "Effect"; readonly _A: A; readonly _E: E; readonly _R: R }
export namespace Effect { export type Any = Effect<any, any, any>; }`,
        "utf8",
      );
      writeFileSync(
        bootstrap,
        `import * as Effect from "./effect.js"; void Effect; export {};`,
        "utf8",
      );
      writeFileSync(
        main,
        `import * as Effect from "./effect.js";
export function fn(): Effect.Effect<string, never, never> {
  return {} as Effect.Effect<string, never, never>;
}`,
        "utf8",
      );
      const program = makeProgram([bootstrap, main]);
      const specs = [
        { id: "Effect", module: "./effect.js", exportName: "Effect", typeMember: "Any" },
      ] as const;
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: specs,
        failWhenNoTargetsResolved: false,
      });
      const result = session.api.file("./main.ts", { baseDir: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const fnExport = result.snapshot.exports.find((e) => e.name === "fn");
      expect(fnExport).toBeDefined();
      expect(
        session.api.isAssignableTo(fnExport!.type, "Effect", [
          { kind: "returnType" },
          {
            kind: "predicate",
            fn: (n) => n.kind === "reference" && (n.typeArguments?.length ?? 0) >= 2,
          },
        ]),
      ).toBe(true);
    });
  });

  it("applies maxDepth when serializing deep types", () => {
    const dir = createTempDir();
    const filePath = join(dir, "deep.ts");
    writeFileSync(
      filePath,
      `
type L0 = { a: number };
type L1 = { b: L0 };
export type Deep = L1;
`,
      "utf8",
    );
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program, maxTypeDepth: 0 });
    const result = session.api.file("./deep.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const deepExport = result.snapshot.exports.find((e) => e.name === "Deep");
    expect(deepExport).toBeDefined();
    expect(deepExport!.type).toBeDefined();
    const type = deepExport!.type as { kind: string; members?: Array<{ type?: unknown }> };
    if (type.kind === "object" && type.members?.length) {
      const firstMemberType = type.members[0]?.type as { kind: string } | undefined;
      expect(firstMemberType?.kind === "reference").toBe(true);
    } else {
      expect(type.kind === "reference" || type.kind === "object").toBe(true);
    }
  });

  it("serializes conditional types when unresolved", () => {
    const dir = createTempDir();
    const filePath = join(dir, "conditional.ts");
    writeFileSync(
      filePath,
      `
export type Cond<T> = T extends number ? "a" : "b";
export type Instantiated = Cond<string>;
`,
      "utf8",
    );
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./conditional.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const cond = result.snapshot.exports.find((e) => e.name === "Cond");
    const inst = result.snapshot.exports.find((e) => e.name === "Instantiated");
    expect(cond).toBeDefined();
    expect(inst).toBeDefined();
    expect(["reference", "conditional", "function"]).toContain(cond!.type.kind);
    expect(["literal", "conditional", "reference"]).toContain(inst!.type.kind);
  });

  it("serializes indexed access or resolved result", () => {
    const dir = createTempDir();
    const filePath = join(dir, "indexed.ts");
    writeFileSync(
      filePath,
      `
interface Obj { a: string; b: number }
export type A = Obj["a"];
export type B = Obj["b"];
`,
      "utf8",
    );
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./indexed.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const a = result.snapshot.exports.find((e) => e.name === "A");
    const b = result.snapshot.exports.find((e) => e.name === "B");
    expect(a?.type.kind).toBeDefined();
    expect(b?.type.kind).toBeDefined();
    expect(["indexedAccess", "primitive", "literal", "reference"]).toContain(a!.type.kind);
    expect(["indexedAccess", "primitive", "literal", "reference"]).toContain(b!.type.kind);
  });

  it("serializes keyof of concrete object as union of string literals", () => {
    const dir = createTempDir();
    const filePath = join(dir, "keyof.ts");
    writeFileSync(filePath, `export type K = keyof { a: 1; b: 2 };`, "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./keyof.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const k = result.snapshot.exports.find((e) => e.name === "K");
    expect(k).toBeDefined();
    expect(k!.type.kind).toBe("union");
    const union = k!.type as { kind: "union"; elements: readonly { kind: string; text: string }[] };
    const texts = new Set(union.elements.map((e) => e.text));
    expect(texts).toEqual(new Set(['"a"', '"b"']));
    expect(union.elements.every((e) => e.kind === "literal")).toBe(true);
  });

  it("serializes keyof type node as typeOperator (IndexType)", () => {
    const dir = createTempDir();
    const filePath = join(dir, "keyof.ts");
    writeFileSync(filePath, `type KeysOf<T> = keyof T;`, "utf8");
    const program = makeProgram([filePath]);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);
    expect(sourceFile).toBeDefined();
    const typeAlias = sourceFile!.statements.find((s): s is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(s),
    );
    expect(typeAlias).toBeDefined();
    const keyofTypeNode = typeAlias!.type;
    if (!ts.isTypeOperatorNode(keyofTypeNode)) {
      throw new Error("Expected type alias RHS to be TypeOperatorNode (keyof T)");
    }
    const keyofType = checker.getTypeFromTypeNode(keyofTypeNode);
    expect((keyofType.flags & ts.TypeFlags.Index) !== 0).toBe(true);
    const serialized = serializeTypeForTest(keyofType, checker, ts);
    expect(serialized.kind).toBe("typeOperator");
    const op = serialized as { kind: "typeOperator"; operator: string; type: unknown };
    expect(op.operator).toBe("keyof");
    expect(op.type).toBeDefined();
    expect(typeof op.type === "object" && op.type !== null && "kind" in (op.type as object)).toBe(
      true,
    );
  });

  it("serializes enum object type as object (enum declaration)", () => {
    const dir = createTempDir();
    const filePath = join(dir, "enum.ts");
    writeFileSync(filePath, `export enum E { A = 1, B = 2 };`, "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./enum.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const e = result.snapshot.exports.find((ex) => ex.name === "E");
    expect(e).toBeDefined();
    expect(e!.type.kind).toBe("object");
  });

  it("serializes enum type as enum with members when TypeFlags.Enum is present", () => {
    const dir = createTempDir();
    const filePath = join(dir, "enum.ts");
    writeFileSync(filePath, `enum E { A = 1, B = 2 }`, "utf8");
    const program = makeProgram([filePath]);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);
    const enumDecl = sourceFile!.statements.find((s): s is ts.EnumDeclaration =>
      ts.isEnumDeclaration(s),
    )!;
    const enumSymbol = checker.getSymbolAtLocation(enumDecl.name);
    const enumType = enumSymbol && checker.getDeclaredTypeOfSymbol(enumSymbol);
    if (!enumType || (enumType.flags & ts.TypeFlags.Enum) === 0) {
      return;
    }
    const serialized = serializeTypeForTest(enumType, checker, ts);
    expect(serialized.kind).toBe("enum");
    const enumNode = serialized as {
      kind: "enum";
      members?: readonly { name: string; value?: string | number }[];
    };
    expect(enumNode.members?.some((m) => m.name === "A" && m.value === 1)).toBe(true);
    expect(enumNode.members?.some((m) => m.name === "B" && m.value === 2)).toBe(true);
  });

  it("serializes enum exports and enum-typed values", () => {
    const dir = createTempDir();
    const filePath = join(dir, "enum.ts");
    writeFileSync(
      filePath,
      `export enum E { A = 1, B = 2 }
export enum S { X = "x", Y = "y" }
export const eVal: E = E.A;
export const sVal: S = S.X;`,
      "utf8",
    );
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./enum.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const e = result.snapshot.exports.find((ex) => ex.name === "E");
    const eVal = result.snapshot.exports.find((ex) => ex.name === "eVal");
    const sValExport = result.snapshot.exports.find((ex) => ex.name === "sVal");
    expect(e?.type.kind).toBe("object");
    expect(eVal!.type.kind).toBe("union");
    const eValUnion = eVal!.type as {
      kind: "union";
      elements: readonly { kind: string; text: string }[];
    };
    const eValTexts = new Set(eValUnion.elements.map((el) => el.text));
    expect(eValTexts).toContain("E.A");
    expect(eValTexts).toContain("E.B");
    expect(sValExport!.type.kind).toBe("union");
    const sValUnion = sValExport!.type as {
      kind: "union";
      elements: readonly { kind: string; text: string }[];
    };
    const sValTexts = new Set(sValUnion.elements.map((el) => el.text));
    expect(sValTexts).toContain("S.X");
    expect(sValTexts).toContain("S.Y");
  });

  it("serializes objects with index signature", () => {
    const dir = createTempDir();
    const filePath = join(dir, "indexSig.ts");
    writeFileSync(filePath, `export type Dict = { [k: string]: number };`, "utf8");
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./indexSig.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const dict = result.snapshot.exports.find((e) => e.name === "Dict");
    expect(dict?.type.kind).toBe("object");
    const obj = dict!.type as { kind: string; indexSignature?: unknown };
    expect(obj.indexSignature).toBeDefined();
  });

  it("serializes overload sets", () => {
    const dir = createTempDir();
    const filePath = join(dir, "overloads.ts");
    writeFileSync(
      filePath,
      `
export function fn(x: string): number;
export function fn(x: number): string;
export function fn(x: string | number): number | string {
  return typeof x === "string" ? x.length : String(x);
}
`,
      "utf8",
    );
    const program = makeProgram([filePath]);
    const session = createTypeInfoApiSession({ ts, program });
    const result = session.api.file("./overloads.ts", { baseDir: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fn = result.snapshot.exports.find((e) => e.name === "fn");
    expect(["function", "overloadSet"]).toContain(fn?.type.kind);
    if (fn?.type.kind === "overloadSet") {
      expect(fn.type.signatures.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("assignabilityMode strict uses checker only", () => {
    const dir = createTempDir();
    const routeMod = join(dir, "route.ts");
    const bootstrap = join(dir, "bootstrap.ts");
    const main = join(dir, "main.ts");
    writeFileSync(
      routeMod,
      `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`,
      "utf8",
    );
    writeFileSync(bootstrap, `import * as Route from "./route.js"; void Route; export {};`, "utf8");
    writeFileSync(
      main,
      `import * as Route from "./route.js"; export const r = Route.Parse("/status");`,
      "utf8",
    );

    const program = makeProgram([bootstrap, main]);
    const specs = [
      { id: "Route", module: "./route.js", exportName: "Route", typeMember: "Any" },
    ] as const;
    const sessionCompat = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: specs,
      failWhenNoTargetsResolved: false,
      assignabilityMode: "compatibility",
    });
    const sessionStrict = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: specs,
      failWhenNoTargetsResolved: false,
      assignabilityMode: "strict",
    });
    const resCompat = sessionCompat.api.file("./main.ts", { baseDir: dir });
    const resStrict = sessionStrict.api.file("./main.ts", { baseDir: dir });
    expect(resCompat.ok && resStrict.ok).toBe(true);
    const rCompat = resCompat.ok
      ? resCompat.snapshot.exports.find((e) => e.name === "r")
      : undefined;
    const rStrict = resStrict.ok
      ? resStrict.snapshot.exports.find((e) => e.name === "r")
      : undefined;
    expect(sessionCompat.api.isAssignableTo(rCompat!.type, "Route")).toBe(true);
    expect(sessionStrict.api.isAssignableTo(rStrict!.type, "Route")).toBe(true);
  });
});
