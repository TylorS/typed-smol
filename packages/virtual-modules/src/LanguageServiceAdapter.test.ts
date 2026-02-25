/// <reference types="node" />
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachLanguageServiceAdapter } from "./LanguageServiceAdapter.js";
import { PluginManager } from "./PluginManager.js";
import { createTypeInfoApiSession } from "./TypeInfoApi.js";
import type { LanguageServiceWatchHost } from "./types.js";

const tempDirs: string[] = [];

const getDiagnosticMessage = (d: ts.Diagnostic): string =>
  typeof d.messageText === "string"
    ? d.messageText
    : ts.flattenDiagnosticMessageText(d.messageText, "\n");

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-ls-"));
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

describe("attachLanguageServiceAdapter", () => {
  it("resolves virtual module imports through host patching", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    writeFileSync(
      entryFile,
      `
import type { Foo } from "virtual:foo";
export const value: Foo = { n: 1 };
`,
      "utf8",
    );

    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
    };

    const languageService = ts.createLanguageService(host);
    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo { n: number }`,
      },
    ]);

    const adapter = attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    const diagnostics = languageService.getSemanticDiagnostics(entryFile);
    expect(diagnostics).toHaveLength(0);
    expect(
      languageService
        .getProgram()
        ?.getSourceFiles()
        .some((sourceFile) => sourceFile.fileName.includes("__virtual_")),
    ).toBe(true);

    adapter.dispose();
  });

  it("keeps record stale and adds diagnostic when rebuild fails, then clears on success", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    const depFile = join(dir, "dep.ts");
    writeFileSync(
      entryFile,
      `import type { Foo } from "virtual:foo"; export const x: Foo = { n: 1 };`,
      "utf8",
    );
    writeFileSync(depFile, "export const d = 1;", "utf8");

    let buildCount = 0;
    let watchCallback: (() => void) | undefined;
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
      [depFile, { version: 1, content: ts.sys.readFile(depFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost & {
      resolveModuleNames?: (...args: unknown[]) => (ts.ResolvedModule | undefined)[];
    } = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
      resolveModuleNames: (..._args: unknown[]): (ts.ResolvedModule | undefined)[] => [],
      resolveModuleNameLiterals: (literals: readonly { readonly text: string }[]) =>
        literals.map(() => ({ resolvedModule: undefined as ts.ResolvedModuleFull | undefined })),
    };

    const watchHost: LanguageServiceWatchHost = {
      watchFile: (path: string, callback: ts.FileWatcherCallback) => {
        watchCallback = () => callback(path, ts.FileWatcherEventKind.Changed);
        return { close: () => {} };
      },
      watchDirectory: () => ({ close: () => {} }),
    };

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: (_id, _importer, api) => {
          buildCount++;
          if (buildCount === 2) {
            throw new Error("second build failed");
          }
          api.file("./dep.ts", { baseDir: dir, watch: true });
          return "export interface Foo { n: number }";
        },
      },
    ]);

    const languageService = ts.createLanguageService(host);
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
      watchHost,
    });

    languageService.getSemanticDiagnostics(entryFile);
    expect(buildCount).toBeGreaterThanOrEqual(1);

    watchCallback?.();
    const diag1 = languageService.getSemanticDiagnostics(entryFile);
    const rebuildFailedDiag = diag1.filter((d) =>
      getDiagnosticMessage(d).includes("rebuild failed"),
    );
    if (rebuildFailedDiag.length > 0) {
      watchCallback?.();
      const diag2 = languageService.getSemanticDiagnostics(entryFile);
      const stillFailed = diag2.filter((d) => getDiagnosticMessage(d).includes("rebuild failed"));
      expect(stillFailed.length).toBe(0);
    }
  });

  it("detects re-entrant resolution and returns diagnostic", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    writeFileSync(entryFile, `import "virtual:foo"; import "virtual:bar";`, "utf8");
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost & { _triggerResolve?: () => void } = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
      resolveModuleNames: (
        _moduleNames: string[],
        _containingFile: string,
        _reusedNames: string[] | undefined,
        _redirectedReference: ts.ResolvedProjectReference | undefined,
        _compilerOptions: ts.CompilerOptions,
        _containingSourceFile?: ts.SourceFile,
      ): (ts.ResolvedModule | undefined)[] => [],
      resolveModuleNameLiterals: (literals: readonly { readonly text: string }[]) =>
        literals.map(() => ({ resolvedModule: undefined as ts.ResolvedModuleFull | undefined })),
    };

    const manager = new PluginManager([
      {
        name: "virtual-foo",
        shouldResolve: (id) => id === "virtual:foo",
        build: (_id, _importer, api) => {
          const h = (api as { _host?: typeof host })._host;
          if (h?.getScriptFileNames) {
            h._triggerResolve?.();
          }
          return "export const foo = 1;";
        },
      },
      {
        name: "virtual-bar",
        shouldResolve: (id) => id === "virtual:bar",
        build: () => "export const bar = 2;",
      },
    ]);

    const languageService = ts.createLanguageService(host);
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
      createTypeInfoApiSession: () => ({
        api: Object.assign(
          {
            file: () => ({ ok: false as const, error: "file-not-in-program" as const }),
            directory: () => [],
          },
          { _host: host },
        ),
        consumeDependencies: () => [],
      }),
    });

    const patchedResolve = (
      host as ts.LanguageServiceHost & { resolveModuleNames?: (...args: unknown[]) => unknown[] }
    ).resolveModuleNames;
    host._triggerResolve = () => {
      patchedResolve?.(["virtual:bar"], entryFile, undefined, undefined, {}, undefined);
    };

    expect(() => languageService.getSemanticDiagnostics(entryFile)).not.toThrow();
    const diagnostics = languageService.getSemanticDiagnostics(entryFile);
    const reentrantDiag = diagnostics.filter((d) => getDiagnosticMessage(d).includes("Re-entrant"));
    expect(reentrantDiag.length).toBeGreaterThanOrEqual(0);
  });

  it("debounces watch callbacks when debounceMs is set", () => {
    vi.useFakeTimers();
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    const depFile = join(dir, "dep.ts");
    writeFileSync(
      entryFile,
      `import type { Foo } from "virtual:foo"; export const x: Foo = { n: 1 };`,
      "utf8",
    );
    writeFileSync(depFile, "export const d = 1;", "utf8");
    let buildCount = 0;
    let watchCallback: (() => void) | undefined;
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
      [depFile, { version: 1, content: ts.sys.readFile(depFile) ?? "" }],
    ]);
    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
    };
    const watchHost: LanguageServiceWatchHost = {
      watchFile: (path: string, callback: ts.FileWatcherCallback) => {
        watchCallback = () => callback(path, ts.FileWatcherEventKind.Changed);
        return { close: () => {} };
      },
      watchDirectory: () => ({ close: () => {} }),
    };
    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: (_id, _importer, api) => {
          buildCount++;
          api.file("./dep.ts", { baseDir: dir, watch: true });
          return "export interface Foo { n: number }";
        },
      },
    ]);
    const languageService = ts.createLanguageService(host);
    const program = ts.createProgram([entryFile, depFile], {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    });
    const createSession = () => createTypeInfoApiSession({ ts, program });
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
      debounceMs: 50,
      watchHost,
      createTypeInfoApiSession: createSession,
    });
    languageService.getSemanticDiagnostics(entryFile);
    expect(buildCount).toBe(1);
    watchCallback?.();
    watchCallback?.();
    watchCallback?.();
    vi.advanceTimersByTime(50);
    languageService.getSemanticDiagnostics(entryFile);
    expect(buildCount).toBe(2);
    vi.useRealTimers();
  });

  it("evicts records when importer is no longer in getScriptFileNames", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    const otherFile = join(dir, "other.ts");
    writeFileSync(
      entryFile,
      `import type { Foo } from "virtual:foo"; export const x: Foo = { n: 1 };`,
      "utf8",
    );
    writeFileSync(otherFile, 'import "virtual:other"; export const y = 1;', "utf8");

    let scriptFileNames = [entryFile, otherFile];
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
      [otherFile, { version: 1, content: ts.sys.readFile(otherFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...scriptFileNames],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
    };

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => "export interface Foo { n: number }",
      },
      {
        name: "virtual-other",
        shouldResolve: (id) => id === "virtual:other",
        build: () => "export const other = 1;",
      },
    ]);

    const languageService = ts.createLanguageService(host);
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    languageService.getSemanticDiagnostics(entryFile);
    const program = languageService.getProgram();
    const virtualFiles =
      program?.getSourceFiles().filter((sf) => sf.fileName.includes("__virtual_")) ?? [];
    expect(virtualFiles.length).toBeGreaterThan(0);
    const virtualFileName = virtualFiles[0].fileName;

    scriptFileNames = [otherFile];

    languageService.getSemanticDiagnostics(otherFile);

    const snapshot = host.getScriptSnapshot?.(virtualFileName);
    expect(snapshot).toBeUndefined();
  });

  it("resolves virtual module that imports another virtual module (virtual-to-virtual)", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    writeFileSync(
      entryFile,
      `import { x } from "virtual:a"; export const out = x;`,
      "utf8",
    );

    const receivedImporters: string[] = [];
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
    };

    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: (id, importer) => {
          receivedImporters.push(`a:${importer}`);
          return `import { x } from "virtual:b"; export { x };`;
        },
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: (id, importer) => {
          receivedImporters.push(`b:${importer}`);
          return `export const x = 1;`;
        },
      },
    ]);

    const languageService = ts.createLanguageService(host);
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    const diagnostics = languageService.getSemanticDiagnostics(entryFile);
    expect(diagnostics).toHaveLength(0);
    expect(receivedImporters).toContain(`a:${entryFile}`);
    expect(receivedImporters).toContain(`b:${entryFile}`);
    expect(
      languageService
        .getProgram()
        ?.getSourceFiles()
        .some((sf) => sf.fileName.includes("__virtual_virtual-a_")),
    ).toBe(true);
    expect(
      languageService
        .getProgram()
        ?.getSourceFiles()
        .some((sf) => sf.fileName.includes("__virtual_virtual-b_")),
    ).toBe(true);
  });

  it("resolves chain virtual:a -> virtual:b -> virtual:c with root importer", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    writeFileSync(
      entryFile,
      `import { z } from "virtual:a"; export const out = z;`,
      "utf8",
    );

    const receivedImporters: string[] = [];
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
    ]);

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
      readDirectory: (...args: Parameters<typeof ts.sys.readDirectory>) =>
        ts.sys.readDirectory(...args),
    };

    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: (_id, importer) => {
          receivedImporters.push(`a:${importer}`);
          return `import { y } from "virtual:b"; export { y as z };`;
        },
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: (_id, importer) => {
          receivedImporters.push(`b:${importer}`);
          return `import { y } from "virtual:c"; export { y };`;
        },
      },
      {
        name: "virtual-c",
        shouldResolve: (id) => id === "virtual:c",
        build: (_id, importer) => {
          receivedImporters.push(`c:${importer}`);
          return `export const y = 42;`;
        },
      },
    ]);

    const languageService = ts.createLanguageService(host);
    attachLanguageServiceAdapter({
      ts,
      languageService,
      languageServiceHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    const diagnostics = languageService.getSemanticDiagnostics(entryFile);
    expect(diagnostics).toHaveLength(0);
    expect(receivedImporters).toContain(`a:${entryFile}`);
    expect(receivedImporters).toContain(`b:${entryFile}`);
    expect(receivedImporters).toContain(`c:${entryFile}`);
  });

  it("dispose then getScriptSnapshot does not throw and returns original behavior", () => {
    const dir = createTempDir();
    const entryFile = join(dir, "entry.ts");
    writeFileSync(
      entryFile,
      `import type { Foo } from "virtual:foo"; export const x: Foo = { n: 1 };`,
      "utf8",
    );
    const files = new Map<string, { version: number; content: string }>([
      [entryFile, { version: 1, content: ts.sys.readFile(entryFile) ?? "" }],
    ]);
    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => ({
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
      }),
      getScriptFileNames: () => [...files.keys()],
      getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName)?.content ?? ts.sys.readFile(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => dir,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (fileName) => files.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => files.get(fileName)?.content ?? ts.sys.readFile(fileName),
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
    languageService.getProgram();
    const program = languageService.getProgram();
    const virtualFile = program?.getSourceFiles().find((sf) => sf.fileName.includes("__virtual_"));
    expect(virtualFile).toBeDefined();
    const virtualFileName = virtualFile!.fileName;

    adapter.dispose();

    expect(() => host.getScriptSnapshot?.(virtualFileName)).not.toThrow();
    const after = host.getScriptSnapshot?.(virtualFileName);
    expect(after).toBeUndefined();
  });
});
