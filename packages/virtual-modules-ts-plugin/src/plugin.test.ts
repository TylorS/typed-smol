/// <reference types="node" />
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  attachLanguageServiceAdapter,
  NodeModulePluginLoader,
  PluginManager,
} from "@typed/virtual-modules";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tempDirs: string[] = [];

const TEST_WORKSPACE = join(
  __dirname,
  "..",
  "..",
  "..",
  ".test-workspace",
  "virtual-modules-ts-plugin",
);

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-tsplugin-"));
  tempDirs.push(dir);
  return dir;
}

function createTempDirInWorkspace(): string {
  mkdirSync(TEST_WORKSPACE, { recursive: true });
  const dir = realpathSync(mkdtempSync(join(TEST_WORKSPACE, "run-")));
  tempDirs.push(dir);
  return dir;
}

function createTempDirCanonical(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "typed-vm-tsplugin-")));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
});

describe("virtual-modules-ts-plugin", () => {
  it("builds and exposes init function", () => {
    const pluginPath = join(__dirname, "..", "dist", "plugin.js");
    const init = require(pluginPath) as (modules: { typescript: typeof import("typescript") }) => {
      create: (info: unknown) => unknown;
    };
    expect(typeof init).toBe("function");
    const result = init({ typescript: ts });
    expect(result).toBeDefined();
    expect(typeof result.create).toBe("function");
  });

  it("loads plugin from disk via NodeModulePluginLoader", () => {
    const dir = createTempDirCanonical();
    writeFileSync(
      join(dir, "test-plugin.cjs"),
      `module.exports = {
  name: "test-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};
`,
      "utf8",
    );
    const loader = new NodeModulePluginLoader();
    const result = loader.load({ specifier: "./test-plugin.cjs", baseDir: dir });
    if (result.status === "error") {
      throw new Error(`Plugin load failed: ${result.message} (code: ${result.code})`);
    }
    expect(result.status).toBe("loaded");
    if (result.status === "loaded") {
      expect(result.plugin.name).toBe("test-virtual");
    }
  });

  it(
    "attaches adapter and resolves virtual modules when create() is called",
    { timeout: 15_000 },
    () => {
      const dir = createTempDirInWorkspace();
      const pluginPath = join(dir, "test-plugin.cjs");
      writeFileSync(
        pluginPath,
        `module.exports = {
  name: "test-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};
`,
        "utf8",
      );

      const entryPath = join(dir, "entry.ts");
      writeFileSync(
        entryPath,
        'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
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

      const host: ts.LanguageServiceHost = {
        getCompilationSettings: () => compilerOptions,
        getScriptFileNames: () => [entryPath],
        getScriptVersion: () => "1",
        getScriptSnapshot: (fileName: string) => {
          const content = ts.sys.readFile(fileName);
          return content != null ? ts.ScriptSnapshot.fromString(content) : undefined;
        },
        getCurrentDirectory: () => dir,
        getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
        fileExists: (fileName) => ts.sys.fileExists(fileName),
        readFile: (fileName) => ts.sys.readFile(fileName),
        readDirectory: (path, extensions, exclude, include, depth) =>
          path === dir || path.startsWith(dir + sep)
            ? ["entry.ts", "test-plugin.cjs"]
            : ts.sys.readDirectory(path, extensions, exclude, include, depth),
      };

      const languageService = ts.createLanguageService(host);

      const pluginDistPath = join(__dirname, "..", "dist", "plugin.js");
      const init = require(pluginDistPath) as (modules: {
        typescript: typeof import("typescript");
      }) => {
        create: (info: {
          languageService: ts.LanguageService;
          project: ts.LanguageServiceHost;
          config?: unknown;
        }) => ts.LanguageService;
      };

      const { create } = init({ typescript: ts });
      const wrapped = create({
        languageService,
        project: host,
        config: { plugins: ["./test-plugin.cjs"] },
      });

      const diagnostics = wrapped.getSemanticDiagnostics(entryPath);
      expect(diagnostics).toHaveLength(0);

      const program = wrapped.getProgram();
      expect(program).toBeDefined();
      expect(program!.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_"))).toBe(true);
    },
  );

  it("resolves virtual modules when using attachLanguageServiceAdapter directly (adapter works)", () => {
    const dir = createTempDir();
    const entryPath = join(dir, "entry.ts");
    writeFileSync(
      entryPath,
      'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
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

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => compilerOptions,
      getScriptFileNames: () => [entryPath],
      getScriptVersion: () => "1",
      getScriptSnapshot: (fileName: string) => {
        const content = ts.sys.readFile(fileName);
        return content != null ? ts.ScriptSnapshot.fromString(content) : undefined;
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
      fileExists: (fileName) => ts.sys.fileExists(fileName),
      readFile: (fileName) => ts.sys.readFile(fileName),
      readDirectory: (...args) => ts.sys.readDirectory(...args),
    };

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => "export interface Foo { n: number }",
      },
    ]);

    const languageService = ts.createLanguageService(host);
    const handle = attachLanguageServiceAdapter({
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
      expect(program!.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_"))).toBe(true);
    } finally {
      handle.dispose();
    }
  });
});
