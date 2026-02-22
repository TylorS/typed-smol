import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { attachCompilerHostAdapter } from "./CompilerHostAdapter.js";
import { PluginManager } from "./PluginManager.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-compiler-"));
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

describe("attachCompilerHostAdapter", () => {
  it("injects virtual modules into a Program graph", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");

    writeFileSync(
      entry,
      `
import type { Foo } from "virtual:foo";
export const value: Foo = { n: 1 };
`,
      "utf8",
    );

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo { n: number }`,
      },
    ]);

    const compilerOptions: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    };
    const host = ts.createCompilerHost(compilerOptions);
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(diagnostics).toHaveLength(0);
    expect(
      program.getSourceFiles().some((sourceFile) => sourceFile.fileName.includes("typed-virtual://")),
    ).toBe(true);

    adapter.dispose();
  });

  it("evicts virtual record when importer no longer exists (fileExists returns false)", () => {
    const dir = createTempDir();
    const entry1 = join(dir, "entry1.ts");
    const entry2 = join(dir, "entry2.ts");
    writeFileSync(
      entry1,
      `import type { Foo } from "virtual:foo"; export const value: Foo = { n: 1 };`,
      "utf8",
    );
    writeFileSync(
      entry2,
      `import type { Bar } from "virtual:bar"; export const value: Bar = { s: "x" };`,
      "utf8",
    );
    const compilerOptions: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    };
    const baseHost = ts.createCompilerHost(compilerOptions);
    const missingPaths = new Set<string>();
    const host = {
      ...baseHost,
      fileExists: (fileName: string) => {
        if (missingPaths.has(fileName)) return false;
        return baseHost.fileExists(fileName);
      },
    };
    const manager = new PluginManager([
      {
        name: "virtual-foo",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo { n: number }`,
      },
      {
        name: "virtual-bar",
        shouldResolve: (id) => id === "virtual:bar",
        build: () => `export interface Bar { s: string }`,
      },
    ]);
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
    });
    const program1 = ts.createProgram([entry1, entry2], compilerOptions, host);
    const virtualFooFile = program1
      .getSourceFiles()
      .find((sf) => sf.fileName.includes("typed-virtual://") && sf.fileName.includes("virtual-foo"));
    expect(virtualFooFile).toBeDefined();
    const virtualFooFileName = virtualFooFile!.fileName;

    missingPaths.add(entry1);
    ts.createProgram([entry2], compilerOptions, host);
    const afterEviction = host.getSourceFile(virtualFooFileName, ts.ScriptTarget.ESNext);
    expect(afterEviction).toBeUndefined();

    adapter.dispose();
  });

  it("dispose then getSourceFile does not throw and returns original behavior", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    writeFileSync(
      entry,
      `import type { Foo } from "virtual:foo"; export const value: Foo = { n: 1 };`,
      "utf8",
    );
    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo { n: number }`,
      },
    ]);
    const compilerOptions: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    };
    const host = ts.createCompilerHost(compilerOptions);
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
    });
    const program = ts.createProgram([entry], compilerOptions, host);
    const virtualFile = program
      .getSourceFiles()
      .find((sf) => sf.fileName.includes("typed-virtual://"));
    expect(virtualFile).toBeDefined();
    const virtualFileName = virtualFile!.fileName;

    adapter.dispose();

    expect(() => host.getSourceFile(virtualFileName, ts.ScriptTarget.ESNext)).not.toThrow();
    const after = host.getSourceFile(virtualFileName, ts.ScriptTarget.ESNext);
    expect(after).toBeUndefined();
  });
});
