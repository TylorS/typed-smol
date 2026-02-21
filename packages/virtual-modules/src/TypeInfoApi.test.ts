import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { createTypeInfoApiSession } from "./TypeInfoApi.js";

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
    writeFileSync(
      join(dir, "a.ts"),
      `export const a = 1;`,
      "utf8",
    );
    writeFileSync(
      join(dir, "b.ts"),
      `export const b = 2;`,
      "utf8",
    );
    mkdirSync(join(dir, "nested"), { recursive: true });
    writeFileSync(join(dir, "nested", "nested.ts"), `export const nested = 3;`, "utf8");

    const program = makeProgram([join(dir, "a.ts"), join(dir, "b.ts"), join(dir, "nested", "nested.ts")]);
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
});
