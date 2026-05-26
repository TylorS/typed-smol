/// <reference types="node" />
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  attachLanguageServiceAdapter,
  hashVirtualArtifactContent,
  NodeModulePluginLoader,
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  PluginManager,
  type VirtualArtifactManifest,
} from "@typed/virtual-modules";
import { invalidTemplateModuleSource } from "@typed/compiler/template/templateFixtures";

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
      join(dir, "test-plugin.mjs"),
      `export default {
  name: "test-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};
`,
      "utf8",
    );
    const loader = new NodeModulePluginLoader();
    const result = loader.load({ specifier: "./test-plugin.mjs", baseDir: dir });
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
      const pluginPath = join(dir, "test-plugin.mjs");
      writeFileSync(
        pluginPath,
        `export default {
  name: "test-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};
`,
        "utf8",
      );
      writeFileSync(
        join(dir, "vmc.config.ts"),
        `export default { plugins: ["./test-plugin.mjs"] };`,
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
            ? ["entry.ts", "test-plugin.mjs", "vmc.config.ts"]
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
        config: {},
      });

      const diagnostics = wrapped.getSemanticDiagnostics(entryPath);
      expect(diagnostics).toHaveLength(0);

      const program = wrapped.getProgram();
      expect(program).toBeDefined();
      expect(program!.getSourceFiles().some(isSharedVirtualArtifactSource)).toBe(true);
    },
  );

  it("appends typed template semantic diagnostics", () => {
    const dir = createTempDirInWorkspace();
    const entryPath = join(dir, "entry.ts");
    writeFileSync(entryPath, `${invalidTemplateModuleSource}\n`, "utf8");

    const service = createPluginLanguageService(dir, entryPath);
    const diagnostics = service.getSemanticDiagnostics(entryPath);

    expect(getDiagnosticMessages(diagnostics).join("\n")).toMatchInlineSnapshot(`
      "Cannot find module '@typed/template' or its corresponding type declarations.
      TYPED-TEMPLATE-ANALYZE-001: Expected AttrValueDq or AttrValueSq or AttrValueNq but got OpenTagEnd"
    `);
  });

  it("emits opt-in timing diagnostics for startup and semantic diagnostics", () => {
    const dir = createTempDirInWorkspace();
    const entryPath = join(dir, "entry.ts");
    const logs: string[] = [];
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: {} }), "utf8");
    writeFileSync(entryPath, "export const value = 1;\n", "utf8");

    const service = createPluginLanguageService(dir, entryPath, {
      config: { debugTimings: true },
      log: (message) => logs.push(message),
    });

    expect(logs.some((message) => message.includes("timing create.total"))).toBe(true);
    expect(logs.some((message) => message.includes("timing fallbackProgram.create"))).toBe(false);

    service.getSemanticDiagnostics(entryPath);

    expect(logs.some((message) => message.includes("timing semanticDiagnostics"))).toBe(true);
  });

  it("materializes create() virtual modules through the shared artifact store", () => {
    const dir = createTempDirInWorkspace();
    const pluginPath = join(dir, "test-plugin.mjs");
    writeFileSync(
      pluginPath,
      `export default {
  name: "artifact-store-test",
  shouldResolve: (id) => id === "virtual:artifact-store",
  build: (id, importer) => {
    if (id !== "virtual:artifact-store") throw new Error("unexpected id");
    if (!importer.endsWith("entry.ts")) throw new Error("unexpected importer: " + importer);
    return "export interface ArtifactStoreValue { n: number }";
  }
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts"],
      }),
      "utf8",
    );

    const entryPath = join(dir, "entry.ts");
    writeFileSync(
      entryPath,
      'import type { ArtifactStoreValue } from "virtual:artifact-store";\nexport const value: ArtifactStoreValue = { n: 1 };\n',
      "utf8",
    );

    const wrapped = createPluginLanguageService(dir, entryPath);
    expect(wrapped.getSemanticDiagnostics(entryPath)).toHaveLength(0);

    const indexPath = join(dir, "node_modules", ".typed", "virtual", "index.json");
    expect(existsSync(indexPath)).toBe(true);
    const parsed = parseVirtualArtifactIndex(JSON.parse(readFileSync(indexPath, "utf8")));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const entries = Object.values(parsed.index.artifacts);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.generatedSourcePath).toContain(join("node_modules", ".typed", "virtual"));
    expect(entries[0]?.generatedSourcePath.startsWith(join(dir, "node_modules"))).toBe(true);
    expect(existsSync(entries[0]!.generatedSourcePath)).toBe(true);
  });

  it("reuses persisted artifacts across create() calls when fingerprints match", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "test-plugin.mjs"),
      `globalThis.__typedTsPluginBuildCount = globalThis.__typedTsPluginBuildCount ?? 0;
export default {
  name: "artifact-reuse-test",
  shouldResolve: (id) => id === "virtual:reuse",
  build: () => {
    globalThis.__typedTsPluginBuildCount++;
    if (globalThis.__typedTsPluginThrowOnBuild) throw new Error("build should not run");
    return "export interface ReusedValue { n: number }";
  }
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    writeFileSync(
      entryPath,
      'import type { ReusedValue } from "virtual:reuse";\nexport const value: ReusedValue = { n: 1 };\n',
      "utf8",
    );

    const globalState = globalThis as {
      __typedTsPluginBuildCount?: number;
      __typedTsPluginThrowOnBuild?: boolean;
    };
    try {
      globalState.__typedTsPluginBuildCount = 0;
      globalState.__typedTsPluginThrowOnBuild = false;
      const first = createPluginLanguageService(dir, entryPath);
      expect(first.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);

      globalState.__typedTsPluginThrowOnBuild = true;
      const second = createPluginLanguageService(dir, entryPath);
      expect(second.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);
    } finally {
      delete globalState.__typedTsPluginBuildCount;
      delete globalState.__typedTsPluginThrowOnBuild;
    }
  });

  it("stores dependency-scoped source fingerprints instead of whole-project source roots", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "test-plugin.mjs"),
      `export default {
  name: "snapshot-source-test",
  shouldResolve: (id) => id === "virtual:snapshot-source",
  build: () => "export interface SnapshotSourceValue { n: number }"
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    const diskSource =
      'import type { SnapshotSourceValue } from "virtual:snapshot-source";\nexport const value: SnapshotSourceValue = { n: 1 };\n// disk\n';
    const snapshotSource =
      'import type { SnapshotSourceValue } from "virtual:snapshot-source";\nexport const value: SnapshotSourceValue = { n: 1 };\n// unsaved\n';
    writeFileSync(entryPath, diskSource, "utf8");

    const wrapped = createPluginLanguageService(dir, entryPath, {
      scriptTextByPath: new Map([[entryPath, snapshotSource]]),
    });
    expect(wrapped.getSemanticDiagnostics(entryPath)).toHaveLength(0);

    const manifest = readSingleArtifactManifest(dir);
    expect(manifest.sourceInputFingerprints).toEqual([
      {
        kind: "source",
        name: "ts-plugin-source-inputs",
        hash: hashVirtualArtifactContent("dependency-descriptor-scoped"),
      },
    ]);
    expect(manifest.sourceInputFingerprints).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: entryPath,
        }),
      ]),
    );
  });

  it("does not reuse stale artifacts after dependency snapshots change", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "test-plugin.mjs"),
      `import path from "node:path";
globalThis.__typedTsPluginBuildCount = globalThis.__typedTsPluginBuildCount ?? 0;
export default {
  name: "snapshot-change-test",
  shouldResolve: (id) => id === "virtual:snapshot-change",
  build: (id, importer, api) => {
    globalThis.__typedTsPluginBuildCount++;
    const dep = api.file("./dep.ts", { baseDir: path.dirname(importer), watch: true });
    if (!dep.ok) throw new Error("dep.ts was not available");
    return "export interface SnapshotChangeValue { n: number }";
  }
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts", "dep.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    const depPath = join(dir, "dep.ts");
    writeFileSync(
      entryPath,
      'import type { SnapshotChangeValue } from "virtual:snapshot-change";\nexport const value: SnapshotChangeValue = { n: 1 };\n',
      "utf8",
    );
    writeFileSync(depPath, "export const dep = 1;\n", "utf8");
    const entrySource = readFileSync(entryPath, "utf8");
    const firstDepSource = "export const dep = 1;\n";
    const secondDepSource = "export const dep = 2;\n";

    const globalState = globalThis as { __typedTsPluginBuildCount?: number };
    try {
      globalState.__typedTsPluginBuildCount = 0;
      const scriptTextByPath = new Map([
        [entryPath, entrySource],
        [depPath, firstDepSource],
      ]);
      const scriptVersionByPath = new Map([
        [entryPath, "1"],
        [depPath, "1"],
      ]);
      const service = createPluginLanguageService(dir, entryPath, {
        scriptFileNames: [entryPath, depPath],
        scriptTextByPath,
        scriptVersionByPath,
      });
      expect(service.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);
      const manifest = readSingleArtifactManifest(dir);
      expect(manifest.dependencyDescriptors).toEqual([
        {
          type: "file",
          path: depPath,
        },
      ]);
      const virtualPath = manifest.generatedSourcePath;

      scriptTextByPath.set(depPath, secondDepSource);
      scriptVersionByPath.set(depPath, "2");
      service.cleanupSemanticCache();
      expect(service.getSemanticDiagnostics(virtualPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBeGreaterThan(1);
    } finally {
      delete globalState.__typedTsPluginBuildCount;
    }
  });

  it("does not reuse persisted artifacts when dependency snapshots differ from disk on boot", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "test-plugin.mjs"),
      `import path from "node:path";
globalThis.__typedTsPluginBuildCount = globalThis.__typedTsPluginBuildCount ?? 0;
export default {
  name: "snapshot-boot-test",
  shouldResolve: (id) => id === "virtual:snapshot-boot",
  build: (id, importer, api) => {
    globalThis.__typedTsPluginBuildCount++;
    const dep = api.file("./dep.ts", { baseDir: path.dirname(importer), watch: true });
    if (!dep.ok) throw new Error("dep.ts was not available");
    return "export interface SnapshotBootValue { n: number }";
  }
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts", "dep.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    const depPath = join(dir, "dep.ts");
    writeFileSync(
      entryPath,
      'import type { SnapshotBootValue } from "virtual:snapshot-boot";\nexport const value: SnapshotBootValue = { n: 1 };\n',
      "utf8",
    );
    writeFileSync(depPath, "export const dep = 1;\n", "utf8");

    const globalState = globalThis as { __typedTsPluginBuildCount?: number };
    try {
      globalState.__typedTsPluginBuildCount = 0;
      const first = createPluginLanguageService(dir, entryPath, {
        scriptFileNames: [entryPath, depPath],
      });
      expect(first.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);

      const second = createPluginLanguageService(dir, entryPath, {
        scriptFileNames: [entryPath, depPath],
        scriptTextByPath: new Map([
          [entryPath, readFileSync(entryPath, "utf8")],
          [depPath, "export const dep = 2;\n"],
        ]),
        scriptVersionByPath: new Map([
          [entryPath, "1"],
          [depPath, "2"],
        ]),
      });
      expect(second.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(2);
    } finally {
      delete globalState.__typedTsPluginBuildCount;
    }
  });

  it("keeps cached artifacts when unrelated source snapshots change", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "test-plugin.mjs"),
      `import path from "node:path";
globalThis.__typedTsPluginBuildCount = globalThis.__typedTsPluginBuildCount ?? 0;
export default {
  name: "dependency-scoped-cache-test",
  shouldResolve: (id) => id === "virtual:dependency-scoped-cache",
  build: (id, importer, api) => {
    globalThis.__typedTsPluginBuildCount++;
    const dep = api.file("./dep.ts", { baseDir: path.dirname(importer), watch: true });
    if (!dep.ok) throw new Error("dep.ts was not available");
    return "export interface DependencyScopedValue { n: number }";
  }
};
`,
      "utf8",
    );
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts", "dep.ts", "unrelated.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    const depPath = join(dir, "dep.ts");
    const unrelatedPath = join(dir, "unrelated.ts");
    writeFileSync(
      entryPath,
      'import type { DependencyScopedValue } from "virtual:dependency-scoped-cache";\nexport const value: DependencyScopedValue = { n: 1 };\n',
      "utf8",
    );
    writeFileSync(depPath, "export const dep = 1;\n", "utf8");
    writeFileSync(unrelatedPath, "export const unrelated = 1;\n", "utf8");

    const globalState = globalThis as { __typedTsPluginBuildCount?: number };
    try {
      globalState.__typedTsPluginBuildCount = 0;
      const scriptTextByPath = new Map([
        [entryPath, readFileSync(entryPath, "utf8")],
        [depPath, readFileSync(depPath, "utf8")],
        [unrelatedPath, "export const unrelated = 1;\n"],
      ]);
      const scriptVersionByPath = new Map([
        [entryPath, "1"],
        [depPath, "1"],
        [unrelatedPath, "1"],
      ]);
      const service = createPluginLanguageService(dir, entryPath, {
        scriptFileNames: [entryPath, depPath, unrelatedPath],
        scriptTextByPath,
        scriptVersionByPath,
      });

      expect(service.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);

      scriptTextByPath.set(unrelatedPath, "export const unrelated = 2;\n");
      scriptVersionByPath.set(unrelatedPath, "2");
      service.cleanupSemanticCache();

      expect(service.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);
    } finally {
      delete globalState.__typedTsPluginBuildCount;
    }
  });

  it("fails closed after vmc plugin modules change in the same create() session", () => {
    const dir = createTempDirInWorkspace();
    const pluginPath = join(dir, "test-plugin.mjs");
    const pluginSource = (
      valueType: "number" | "string",
    ) => `globalThis.__typedTsPluginBuildCount = globalThis.__typedTsPluginBuildCount ?? 0;
export default {
  name: "plugin-drift-test",
  shouldResolve: (id) => id === "virtual:plugin-drift",
  build: () => {
    globalThis.__typedTsPluginBuildCount++;
    return "export interface PluginDriftValue { value: ${valueType} }";
  }
};
`;
    writeFileSync(pluginPath, pluginSource("number"), "utf8");
    writeFileSync(join(dir, "vmc.config.ts"), `export default { plugins: ["./test-plugin.mjs"] };`);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          skipLibCheck: true,
        },
        files: ["entry.ts"],
      }),
      "utf8",
    );
    const entryPath = join(dir, "entry.ts");
    writeFileSync(
      entryPath,
      'import type { PluginDriftValue } from "virtual:plugin-drift";\nexport const value: PluginDriftValue = { value: 1 };\n',
      "utf8",
    );

    const globalState = globalThis as { __typedTsPluginBuildCount?: number };
    try {
      globalState.__typedTsPluginBuildCount = 0;
      const service = createPluginLanguageService(dir, entryPath);
      expect(service.getSemanticDiagnostics(entryPath)).toHaveLength(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);
      const firstManifest = readSingleArtifactManifest(dir);

      writeFileSync(pluginPath, pluginSource("string"), "utf8");
      const firstDiagnostics = service.getSemanticDiagnostics(entryPath);
      expect(getDiagnosticMessages(firstDiagnostics).join("\n")).toMatchInlineSnapshot(`
        "Cannot find module 'virtual:plugin-drift' or its corresponding type declarations.
        Virtual module rebuild failed: Virtual artifact resolution failed: TS plugin resolver inputs changed after startup: vmc.config.ts or loaded VMC plugin modules changed after the TS plugin resolver was created. Restart TypeScript or recreate the language service before materializing virtual artifacts.
        Virtual artifact resolution failed: TS plugin resolver inputs changed after startup: vmc.config.ts or loaded VMC plugin modules changed after the TS plugin resolver was created. Restart TypeScript or recreate the language service before materializing virtual artifacts."
      `);
      const firstDriftMessages = getDiagnosticMessages(firstDiagnostics).filter((message) =>
        message.includes("TS plugin resolver inputs changed after startup"),
      );
      expect(firstDriftMessages.length).toBeGreaterThan(0);
      expect(globalState.__typedTsPluginBuildCount).toBe(1);
      expect(readSingleArtifactManifest(dir).generatedSourceHash).toBe(
        firstManifest.generatedSourceHash,
      );

      const repeatedDiagnostics = service.getSemanticDiagnostics(entryPath);
      const repeatedDriftMessages = getDiagnosticMessages(repeatedDiagnostics).filter((message) =>
        message.includes("TS plugin resolver inputs changed after startup"),
      );
      expect(repeatedDriftMessages).toHaveLength(firstDriftMessages.length);
    } finally {
      delete globalState.__typedTsPluginBuildCount;
    }
  });

  it("loads plugins from vmc.config.ts when tsconfig plugin list is omitted", () => {
    const dir = createTempDirInWorkspace();
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `const plugin = {
  name: "test-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }"
};

export default { plugins: [plugin] };
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
      readDirectory: (...args) => ts.sys.readDirectory(...args),
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
      config: {},
    });

    const diagnostics = wrapped.getSemanticDiagnostics(entryPath);
    expect(diagnostics).toHaveLength(0);
    const program = wrapped.getProgram();
    expect(program).toBeDefined();
    expect(program!.getSourceFiles().some(isSharedVirtualArtifactSource)).toBe(true);
  });

  it(
    "resolves TypeInfo-dependent virtual modules on first boot when getProgram() is initially undefined",
    { timeout: 15_000 },
    () => {
      const dir = createTempDirInWorkspace();
      writeFileSync(
        join(dir, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            target: "ESNext",
            module: "ESNext",
            moduleResolution: "bundler",
            skipLibCheck: true,
          },
        }),
        "utf8",
      );
      writeFileSync(
        join(dir, "vmc.config.ts"),
        `const path = require("path");
const plugin = {
  name: "typeinfo-boot-test",
  shouldResolve: (id) => id === "typeinfo:boot-test",
  build: (id, importer, api) => {
    api.directory("*.ts", { baseDir: path.dirname(importer), recursive: false });
    return { sourceText: "export const x = 1;" };
  },
};
export default { plugins: [plugin] };
`,
        "utf8",
      );
      const entryPath = join(dir, "entry.ts");
      writeFileSync(
        entryPath,
        'import { x } from "typeinfo:boot-test";\nexport const value = x;\n',
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

      const host: ts.LanguageServiceHost & { configFilePath?: string } = {
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
            ? ["entry.ts", "vmc.config.ts", "tsconfig.json"]
            : ts.sys.readDirectory(path, extensions, exclude, include, depth),
      };
      host.configFilePath = join(dir, "tsconfig.json");

      const realLS = ts.createLanguageService(host);
      let getProgramCallCount = 0;
      const wrappedLS: ts.LanguageService = {
        ...realLS,
        getProgram: () => {
          getProgramCallCount++;
          if (getProgramCallCount <= 1) return undefined;
          return realLS.getProgram();
        },
      };

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
        languageService: wrappedLS,
        project: host,
        config: {},
      });

      const diagnostics = wrapped.getSemanticDiagnostics(entryPath);
      expect(diagnostics).toHaveLength(0);

      const program = wrapped.getProgram();
      expect(program).toBeDefined();
      expect(program!.getSourceFiles().some(isSharedVirtualArtifactSource)).toBe(true);
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

interface CreatePluginLanguageServiceOptions {
  readonly config?: unknown;
  readonly log?: (message: string) => void;
  readonly scriptFileNames?: readonly string[];
  readonly scriptTextByPath?: ReadonlyMap<string, string>;
  readonly scriptVersionByPath?: ReadonlyMap<string, string>;
}

function createPluginLanguageService(
  dir: string,
  entryPath: string,
  options: CreatePluginLanguageServiceOptions = {},
): ts.LanguageService {
  const compilerOptions: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  };

  const host: ts.LanguageServiceHost & {
    configFilePath?: string;
    projectService?: { logger?: { info?: (message: string) => void } };
  } = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => [...(options.scriptFileNames ?? [entryPath])],
    getScriptVersion: (fileName: string) => options.scriptVersionByPath?.get(fileName) ?? "1",
    getProjectVersion: () =>
      options.scriptVersionByPath ? [...options.scriptVersionByPath.values()].join(":") : "1",
    getScriptSnapshot: (fileName: string) => {
      const content = options.scriptTextByPath?.get(fileName) ?? ts.sys.readFile(fileName);
      return content != null ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getCurrentDirectory: () => dir,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: (fileName) => ts.sys.fileExists(fileName),
    readFile: (fileName) => ts.sys.readFile(fileName),
    readDirectory: (...args) => ts.sys.readDirectory(...args),
  };
  host.configFilePath = join(dir, "tsconfig.json");
  if (options.log) host.projectService = { logger: { info: options.log } };

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
  return init({ typescript: ts }).create({
    languageService,
    project: host,
    config: options.config ?? {},
  });
}

function isSharedVirtualArtifactSource(sourceFile: ts.SourceFile): boolean {
  return sourceFile.fileName.includes(join("node_modules", ".typed", "virtual"));
}

function readSingleArtifactManifest(projectRoot: string): VirtualArtifactManifest {
  const indexPath = join(projectRoot, "node_modules", ".typed", "virtual", "index.json");
  const index = parseVirtualArtifactIndex(JSON.parse(readFileSync(indexPath, "utf8")));
  expect(index.ok, index.ok ? "" : index.reason).toBe(true);
  if (!index.ok) throw new Error(index.reason);
  const artifacts = Object.values(index.index.artifacts);
  expect(artifacts).toHaveLength(1);
  const manifest = parseVirtualArtifactManifest(
    JSON.parse(readFileSync(artifacts[0]!.manifestPath, "utf8")),
  );
  expect(manifest.ok, manifest.ok ? "" : manifest.reason).toBe(true);
  if (!manifest.ok) throw new Error(manifest.reason);
  return manifest.manifest;
}

function getDiagnosticMessages(diagnostics: readonly ts.Diagnostic[]): readonly string[] {
  return diagnostics.map((diagnostic) =>
    typeof diagnostic.messageText === "string"
      ? diagnostic.messageText
      : ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
}
