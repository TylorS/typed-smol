/**
 * Integration test using @manuth/typescript-languageservice-tester.
 * Validates that the LS tester harness runs against a real tsserver workspace.
 * Full virtual-module resolution in tsserver would require a TypeScript plugin
 * that attaches our adapter (TS-4 / TS-12); the in-memory test in LanguageServiceAdapter.test.ts
 * covers resolution and diagnostics with ts.createLanguageService + adapter.
 *
 * Additional in-process integration tests validate load, build, and import of virtual
 * modules with the real TypeScript language service and compiler (real temp dirs, real hosts).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageServiceTester } from "@manuth/typescript-languageservice-tester";
import { attachCompilerHostAdapter } from "./CompilerHostAdapter.js";
import { attachLanguageServiceAdapter } from "./LanguageServiceAdapter.js";
import { NodeModulePluginLoader } from "./NodeModulePluginLoader.js";
import { PluginManager } from "./PluginManager.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-lstester-"));
  tempDirs.push(dir);
  return dir;
}

const standardCompilerOptions: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
};

function createProjectWithVirtualEntry(dir: string, entryContent: string): { entryPath: string } {
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Bundler",
        noEmit: true,
        skipLibCheck: true,
      },
      include: ["*.ts"],
    }),
    "utf8",
  );
  const entryPath = join(dir, "entry.ts");
  writeFileSync(entryPath, entryContent, "utf8");
  return { entryPath };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
});

describe("LanguageServiceTester integration", () => {
  it("runs tsserver-backed analysis via LanguageServiceTester", { timeout: 60_000 }, async () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "ESNext",
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["*.ts"],
      }),
      "utf8",
    );
    writeFileSync(join(dir, "index.ts"), "export const x = 1;\n", "utf8");

    const tester = new LanguageServiceTester(dir);
    try {
      await tester.Install();
      await tester.Configure();
      const result = await tester.AnalyzeCode("export const y = 2;", "TS", "file.ts");
      expect(result).toBeDefined();
      expect(result.Diagnostics).toBeDefined();
      expect(Array.isArray(result.Diagnostics)).toBe(true);
    } finally {
      await tester.Dispose();
    }
  });
});

describe("Virtual modules with real TypeScript", () => {
  it(
    "imports virtual module with real Language Service (host reads from disk)",
    { timeout: 15_000 },
    () => {
      const dir = createTempDir();
      const { entryPath } = createProjectWithVirtualEntry(
        dir,
        'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
      );

      const host: ts.LanguageServiceHost = {
        getCompilationSettings: () => standardCompilerOptions,
        getScriptFileNames: () => [entryPath],
        getScriptVersion: () => "1",
        getScriptSnapshot: (fileName: string) => {
          const content = ts.sys.readFile(fileName);
          return content != null ? ts.ScriptSnapshot.fromString(content) : undefined;
        },
        getCurrentDirectory: () => dir,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: (fileName) => ts.sys.fileExists(fileName),
        readFile: (fileName) => ts.sys.readFile(fileName),
        readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
          ts.sys.readDirectory(...args),
      };

      const manager = new PluginManager([
        {
          name: "virtual",
          shouldResolve: (id) => id === "virtual:foo",
          build: () => "export interface Foo { n: number }",
        },
      ]);

      const languageService = ts.createLanguageService(host);
      const adapter = attachLanguageServiceAdapter({
        ts,
        languageService,
        languageServiceHost: host,
        resolver: manager,
        projectRoot: dir,
      });

      try {
        const diagnostics = languageService.getSemanticDiagnostics(entryPath);
        expect(diagnostics).toHaveLength(0);
        const program = languageService.getProgram();
        expect(program).toBeDefined();
        expect(program!.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_"))).toBe(
          true,
        );
      } finally {
        adapter.dispose();
      }
    },
  );

  it(
    "builds program that imports virtual module with real CompilerHost",
    { timeout: 15_000 },
    () => {
      const dir = createTempDir();
      const { entryPath } = createProjectWithVirtualEntry(
        dir,
        'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
      );

      const manager = new PluginManager([
        {
          name: "virtual",
          shouldResolve: (id) => id === "virtual:foo",
          build: () => "export interface Foo { n: number }",
        },
      ]);

      const host = ts.createCompilerHost(standardCompilerOptions);
      const adapter = attachCompilerHostAdapter({
        ts,
        compilerHost: host,
        resolver: manager,
        projectRoot: dir,
      });

      try {
        const program = ts.createProgram([entryPath], standardCompilerOptions, host);
        const diagnostics = ts.getPreEmitDiagnostics(program);
        expect(diagnostics).toHaveLength(0);
        expect(program.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_"))).toBe(
          true,
        );
      } finally {
        adapter.dispose();
      }
    },
  );

  it(
    "loads plugin from disk and resolves virtual module via Language Service",
    { timeout: 15_000 },
    () => {
      const dir = createTempDir();
      writeFileSync(
        join(dir, "plugin.cjs"),
        `module.exports = {
  name: "virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};
`,
        "utf8",
      );
      const { entryPath } = createProjectWithVirtualEntry(
        dir,
        'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
      );

      const loader = new NodeModulePluginLoader();
      const loadResult = loader.load({ specifier: "./plugin.cjs", baseDir: dir });
      expect(loadResult.status).toBe("loaded");
      if (loadResult.status !== "loaded") return;

      const manager = new PluginManager([loadResult.plugin]);

      const host: ts.LanguageServiceHost = {
        getCompilationSettings: () => standardCompilerOptions,
        getScriptFileNames: () => [entryPath],
        getScriptVersion: () => "1",
        getScriptSnapshot: (fileName: string) => {
          const content = ts.sys.readFile(fileName);
          return content != null ? ts.ScriptSnapshot.fromString(content) : undefined;
        },
        getCurrentDirectory: () => dir,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        fileExists: (fileName) => ts.sys.fileExists(fileName),
        readFile: (fileName) => ts.sys.readFile(fileName),
        readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
          ts.sys.readDirectory(...args),
      };

      const languageService = ts.createLanguageService(host);
      const adapter = attachLanguageServiceAdapter({
        ts,
        languageService,
        languageServiceHost: host,
        resolver: manager,
        projectRoot: dir,
      });

      try {
        const diagnostics = languageService.getSemanticDiagnostics(entryPath);
        expect(diagnostics).toHaveLength(0);
        const program = languageService.getProgram();
        expect(program).toBeDefined();
        expect(program!.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_"))).toBe(
          true,
        );
      } finally {
        adapter.dispose();
      }
    },
  );
});
