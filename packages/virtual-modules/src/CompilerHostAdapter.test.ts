import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { attachCompilerHostAdapter } from "./CompilerHostAdapter.js";
import { PluginManager } from "./PluginManager.js";
import type {
  MaterializeVirtualArtifactParams,
  ResolveVirtualArtifactParams,
  VirtualArtifactStore,
} from "./internal/ArtifactStore.js";
import type { VirtualLogicalIdentity } from "./internal/ArtifactIdentity.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-vm-compiler-"));
  tempDirs.push(dir);
  return dir;
};

const createFakeArtifactStore = (
  sourcePath: string,
  onMaterialize?: (params: MaterializeVirtualArtifactParams) => void,
  onClean?: () => void,
): VirtualArtifactStore => {
  const logicalIdentity = "typed-virtual://0/virtual/0123456789abcdef.ts" as VirtualLogicalIdentity;
  const paths = {
    logicalIdentity,
    sourcePath,
    manifestPath: sourcePath.replace(/\.ts$/, ".manifest.json"),
  };
  return {
    indexPath: join(sourcePath, "..", "index.json"),
    resolve: (_params: ResolveVirtualArtifactParams) => ({
      status: "miss",
      reason: "manifest-missing",
      logicalIdentity,
      paths,
      diagnostics: [],
      warnings: [],
    }),
    readManifest: () => ({ status: "missing", reason: "manifest-missing" }),
    materialize: (params) => {
      onMaterialize?.(params);
      mkdirSync(dirname(sourcePath), { recursive: true });
      writeFileSync(sourcePath, params.sourceText, "utf8");
      return { logicalIdentity, paths, manifest: {} as never };
    },
    readProjectIndex: () => ({ status: "missing", reason: "index-missing" }),
    clean: () => {
      onClean?.();
      return { removed: false, rootPath: join(sourcePath, "..") };
    },
    __unsafeReleaseLockForTesting: () => {},
  };
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
      program.getSourceFiles().some((sourceFile) => sourceFile.fileName.includes("__virtual_")),
    ).toBe(true);

    adapter.dispose();
  });

  it("sets virtual source file versions for builder programs", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    writeFileSync(entry, `import type { Foo } from "virtual:foo";`, "utf8");

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo { n: number }`,
      },
    ]);
    const compilerOptions: ts.CompilerOptions = {
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
    const virtualFile = program.getSourceFiles().find((sf) => sf.fileName.includes("__virtual_"));
    expect((virtualFile as { readonly version?: string } | undefined)?.version).toBe("1");

    adapter.dispose();
  });

  it("resolves virtual module that imports another virtual module (virtual-to-virtual)", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    writeFileSync(entry, `import { x } from "virtual:a"; export const out = x;`, "utf8");

    const receivedImporters: string[] = [];
    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: (_id, importer) => {
          receivedImporters.push(`a:${importer}`);
          return `import { x } from "virtual:b"; export { x };`;
        },
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: (_id, importer) => {
          receivedImporters.push(`b:${importer}`);
          return `export const x = 1;`;
        },
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
    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(diagnostics).toHaveLength(0);
    expect(receivedImporters).toContain(`a:${entry}`);
    expect(receivedImporters).toContain(`b:${entry}`);
    expect(
      program.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_virtual-a_")),
    ).toBe(true);
    expect(
      program.getSourceFiles().some((sf) => sf.fileName.includes("__virtual_virtual-b_")),
    ).toBe(true);
  });

  it("keeps logical ids and effective real importers when artifact paths back virtual records", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    const artifactA = join(dir, "node_modules/.typed/virtual/virtual-a/artifact-a.ts");
    const artifactB = join(dir, "node_modules/.typed/virtual/virtual-b/artifact-b.ts");
    writeFileSync(entry, `import { x } from "virtual:a"; export const out = x;`, "utf8");

    const buildCalls: string[] = [];
    const materializeCalls: string[] = [];
    let cleanCalls = 0;
    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: (id, importer) => {
          buildCalls.push(`${id}:${importer}`);
          return `import { x } from "virtual:b"; export { x };`;
        },
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: (id, importer) => {
          buildCalls.push(`${id}:${importer}`);
          return `export const x = 1;`;
        },
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
    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
      artifactStoreFactory: ({ pluginName }) =>
        createFakeArtifactStore(
          pluginName === "virtual-a" ? artifactA : artifactB,
          (params) => {
            materializeCalls.push(`${params.id}:${params.importer}:${params.sourceText}`);
          },
          () => {
            cleanCalls += 1;
            throw new Error("normal build should not clean artifacts");
          },
        ),
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(diagnostics).toHaveLength(0);
    expect(buildCalls).toEqual([`virtual:a:${entry}`, `virtual:b:${entry}`]);
    expect(materializeCalls).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`virtual:a:${entry}`),
        expect.stringContaining(`virtual:b:${entry}`),
      ]),
    );
    expect(program.getSourceFile(artifactA)).toBeDefined();
    expect(program.getSourceFile(artifactB)).toBeDefined();
    expect(cleanCalls).toBe(0);
  });

  it("rewrites nested virtual imports to relative artifact imports for emit", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    const artifactA = join(dir, "node_modules/.typed/virtual/virtual-a/artifact-a.ts");
    const artifactB = join(dir, "node_modules/.typed/virtual/virtual-b/artifact-b.ts");
    writeFileSync(entry, `import { x } from "virtual:a"; export const out = x;`, "utf8");

    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: () => `import { x } from "virtual:b"; export { x };`,
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: () => `export const x = 1;`,
      },
    ]);

    const compilerOptions: ts.CompilerOptions = {
      strict: true,
      outDir: join(dir, "dist"),
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    };
    const host = ts.createCompilerHost(compilerOptions);
    const emitted = new Map<string, string>();
    const originalWriteFile = host.writeFile.bind(host);
    host.writeFile = (fileName, text, writeByteOrderMark, onError, sourceFiles, data) => {
      emitted.set(fileName, text);
      originalWriteFile(fileName, text, writeByteOrderMark, onError, sourceFiles, data);
    };

    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
      artifactStoreFactory: ({ pluginName }) =>
        createFakeArtifactStore(pluginName === "virtual-a" ? artifactA : artifactB),
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const emit = program.emit();
    const artifactAOutput = [...emitted.entries()].find(([path]) =>
      path.endsWith("node_modules/.typed/virtual/virtual-a/artifact-a.js"),
    );
    const artifactBOutput = [...emitted.keys()].find((path) =>
      path.endsWith("node_modules/.typed/virtual/virtual-b/artifact-b.js"),
    );

    expect(diagnostics).toHaveLength(0);
    expect(emit.diagnostics).toHaveLength(0);
    expect(program.getSourceFile(artifactA)?.text).toContain(
      `from "../virtual-b/artifact-b.js"`,
    );
    expect(artifactAOutput?.[1]).toContain(`from "../virtual-b/artifact-b.js"`);
    expect(artifactAOutput?.[1]).not.toContain("virtual:b");
    expect(artifactBOutput).toBeDefined();
  });

  it("uses artifact cache hits without rebuilding or rematerializing", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    const artifact = join(dir, "node_modules/.typed/virtual/virtual/hit.ts");
    const logicalIdentity =
      "typed-virtual://0/virtual/0123456789abcdef.ts" as VirtualLogicalIdentity;
    const paths = {
      logicalIdentity,
      sourcePath: artifact,
      manifestPath: artifact.replace(/\.ts$/, ".manifest.json"),
    };
    let buildCount = 0;
    let materializeCount = 0;
    writeFileSync(
      entry,
      `import type { Foo } from "virtual:foo"; export const value: Foo = { n: 1 };`,
      "utf8",
    );

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => {
          buildCount += 1;
          throw new Error("cache hit should not rebuild");
        },
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
    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
      artifactStoreFactory: () => ({
        ...createFakeArtifactStore(artifact),
        resolve: () => ({
          status: "hit",
          logicalIdentity,
          paths,
          manifest: {
            dependencyDescriptors: [],
            diagnostics: [],
            warnings: [],
          } as never,
          sourceText: "export interface Foo { n: number }",
          diagnostics: [],
          warnings: [],
        }),
        materialize: () => {
          materializeCount += 1;
          throw new Error("cache hit should not materialize");
        },
      }),
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(diagnostics).toHaveLength(0);
    expect(buildCount).toBe(0);
    expect(materializeCount).toBe(0);
    expect(program.getSourceFile(artifact)?.text).toBe("export interface Foo { n: number }");
  });

  it("reports artifact-store materialization failures through compiler diagnostics", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    const reported: ts.Diagnostic[] = [];
    writeFileSync(
      entry,
      `import type { Foo } from "virtual:foo"; export const x: Foo = {};`,
      "utf8",
    );

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo {}`,
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
    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
      artifactStoreFactory: () => ({
        ...createFakeArtifactStore(join(dir, "node_modules/.typed/virtual/virtual/broken.ts")),
        materialize: () => {
          throw new Error("disk cache is read-only");
        },
      }),
      reportDiagnostic: (diagnostic) => reported.push(diagnostic),
    });

    ts.createProgram([entry], compilerOptions, host);

    expect(reported.map((diagnostic) => String(diagnostic.messageText))).toContain(
      "Virtual artifact materialization failed: disk cache is read-only",
    );
  });

  it("rebuilds recoverable artifact cache invalid states instead of reporting cache diagnostics", () => {
    const dir = createTempDir();
    const entry = join(dir, "entry.ts");
    const reported: ts.Diagnostic[] = [];
    const artifact = join(dir, "node_modules/.typed/virtual/virtual/corrupt.ts");
    const materializeCalls: MaterializeVirtualArtifactParams[] = [];
    writeFileSync(
      entry,
      `import type { Foo } from "virtual:foo"; export const x: Foo = {};`,
      "utf8",
    );

    const manager = new PluginManager([
      {
        name: "virtual",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => `export interface Foo {}`,
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
    attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver: manager,
      projectRoot: dir,
      artifactStoreFactory: () => ({
        ...createFakeArtifactStore(artifact, (params) => {
          materializeCalls.push(params);
        }),
        resolve: () => {
          const logicalIdentity =
            "typed-virtual://0/virtual/0123456789abcdef.ts" as VirtualLogicalIdentity;
          return {
            status: "invalid",
            reason: "manifest-corrupt",
            logicalIdentity,
            paths: {
              logicalIdentity,
              sourcePath: artifact,
              manifestPath: artifact.replace(/\.ts$/, ".manifest.json"),
            },
            diagnostics: [
              {
                severity: "error",
                message: "artifact manifest could not be parsed",
                code: "manifest-corrupt",
                source: "virtual",
              },
            ],
            warnings: [],
          };
        },
      }),
      reportDiagnostic: (diagnostic) => reported.push(diagnostic),
    });

    const program = ts.createProgram([entry], compilerOptions, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(diagnostics).toHaveLength(0);
    expect(reported).toHaveLength(0);
    expect(materializeCalls).toHaveLength(1);
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
      .find((sf) => sf.fileName.includes("__virtual_") && sf.fileName.includes("virtual-foo"));
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
    const virtualFile = program.getSourceFiles().find((sf) => sf.fileName.includes("__virtual_"));
    expect(virtualFile).toBeDefined();
    const virtualFileName = virtualFile!.fileName;

    adapter.dispose();

    expect(() => host.getSourceFile(virtualFileName, ts.ScriptTarget.ESNext)).not.toThrow();
    const after = host.getSourceFile(virtualFileName, ts.ScriptTarget.ESNext);
    expect(after).toBeUndefined();
  });
});
