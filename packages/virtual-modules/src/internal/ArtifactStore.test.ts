import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createGeneratedSourceHash,
  createVirtualArtifactStore,
  type VirtualArtifactFingerprint,
} from "../index.js";

const sourceFingerprint = (hash = "sha256:source"): VirtualArtifactFingerprint => ({
  kind: "file",
  name: "src/routes.ts",
  hash,
});

const pluginFingerprint = (hash = "sha256:plugin"): VirtualArtifactFingerprint => ({
  kind: "module",
  name: "routes-plugin",
  hash,
});

const compilerFingerprint = (hash = "sha256:compiler"): VirtualArtifactFingerprint => ({
  kind: "typescript",
  name: "typescript",
  version: "5.9.0",
  hash,
});

describe("ArtifactStore", () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "typed-vm-store-"));
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  const createStore = () =>
    createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });

  const materialize = (sourceText = "export const route = '/a';\n") => {
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(join(projectRoot, "src/routes.ts"), "export const routeSource = true;\n", "utf8");
    return createStore().materialize({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
      sourceText,
      dependencyDescriptors: [{ type: "file", path: join(projectRoot, "src/routes.ts") }],
      diagnostics: [{ severity: "info", message: "built routes", source: "typed/app" }],
      warnings: [{ severity: "warning", message: "route metadata is sparse" }],
    });
  };

  it("resolves a missing artifact as a clear cache miss", () => {
    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result).toEqual({
      status: "miss",
      reason: "manifest-missing",
      logicalIdentity: expect.stringMatching(/^typed-virtual:\/\/0\/typed-app\/[a-f0-9]{16}\.ts$/),
      paths: expect.objectContaining({
        sourcePath: expect.stringContaining("node_modules/.typed/virtual"),
        manifestPath: expect.stringContaining(".manifest.json"),
      }),
      diagnostics: [],
      warnings: [],
    });
  });

  it("materializes source and manifest, then validates an unchanged cache hit", () => {
    const written = materialize();
    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(existsSync(written.paths.sourcePath)).toBe(true);
    expect(existsSync(written.paths.manifestPath)).toBe(true);
    expect(result).toEqual({
      status: "hit",
      logicalIdentity: written.logicalIdentity,
      paths: written.paths,
      manifest: expect.objectContaining({
        generatedSourceHash: createGeneratedSourceHash("export const route = '/a';\n"),
        diagnostics: [{ severity: "info", message: "built routes", source: "typed/app" }],
        warnings: [{ severity: "warning", message: "route metadata is sparse" }],
      }),
      sourceText: "export const route = '/a';\n",
      diagnostics: [{ severity: "info", message: "built routes", source: "typed/app" }],
      warnings: [{ severity: "warning", message: "route metadata is sparse" }],
    });
  });

  it("invalidates recursive glob dependencies when a nested file changes", () => {
    const nestedDir = join(projectRoot, "inputs", "nested");
    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(nestedDir, "shape.ts"), "export type Shape = number;\n", "utf8");
    const written = createStore().materialize({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
      sourceText: "export interface Foo { n: number }\n",
      dependencyDescriptors: [
        {
          type: "glob",
          baseDir: join(projectRoot, "inputs"),
          relativeGlobs: ["*.ts"],
          recursive: true,
        },
      ],
    });

    expect(
      createStore().resolve({
        id: "virtual:routes",
        importer: join(projectRoot, "src/root.ts"),
      }).status,
    ).toBe("hit");

    writeFileSync(join(nestedDir, "shape.ts"), "export type Shape = string;\n", "utf8");
    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("fingerprint-mismatch");
    expect(result.logicalIdentity).toBe(written.logicalIdentity);
  });

  it("does not fingerprint files ignored by TypeInfo recursive directory queries", () => {
    const inputDir = join(projectRoot, "inputs");
    mkdirSync(inputDir, { recursive: true });
    writeFileSync(join(inputDir, "shape.ts"), "export type Shape = number;\n", "utf8");
    writeFileSync(join(inputDir, "ignored.json"), '{ "shape": "number" }\n', "utf8");
    createStore().materialize({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
      sourceText: "export interface Foo { n: number }\n",
      dependencyDescriptors: [
        {
          type: "glob",
          baseDir: inputDir,
          relativeGlobs: ["*"],
          recursive: true,
        },
      ],
    });

    writeFileSync(join(inputDir, "ignored.json"), '{ "shape": "string" }\n', "utf8");
    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result.status).toBe("hit");
  });

  it("treats corrupt manifests as invalid without throwing", () => {
    const written = materialize();
    writeFileSync(written.paths.manifestPath, "{ not-json", "utf8");

    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result).toEqual({
      status: "invalid",
      reason: "manifest-corrupt",
      details: expect.stringContaining("Expected property name"),
      logicalIdentity: written.logicalIdentity,
      paths: written.paths,
      diagnostics: [],
      warnings: [],
    });
  });

  it("invalidates a cache entry when generated source hash changes", () => {
    const written = materialize();
    writeFileSync(written.paths.sourcePath, "export const route = '/changed';\n", "utf8");

    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("source-hash-mismatch");
  });

  it("invalidates missing generated source without throwing", () => {
    const written = materialize();
    rmSync(written.paths.sourcePath);

    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result).toEqual({
      status: "invalid",
      reason: "source-missing",
      logicalIdentity: written.logicalIdentity,
      paths: written.paths,
      manifest: expect.objectContaining({
        logicalIdentity: written.logicalIdentity,
      }),
      diagnostics: [{ severity: "info", message: "built routes", source: "typed/app" }],
      warnings: [{ severity: "warning", message: "route metadata is sparse" }],
    });
  });

  it("updates the project index for discovery but does not trust it over the manifest", () => {
    const written = materialize();
    const store = createStore();
    const index = store.readProjectIndex();

    expect(index.status).toBe("ok");
    if (index.status !== "ok") return;
    expect(index.index.artifacts[written.logicalIdentity]).toEqual(
      expect.objectContaining({
        logicalIdentity: written.logicalIdentity,
        generatedSourcePath: written.paths.sourcePath,
        manifestPath: written.paths.manifestPath,
        diagnosticsCount: 1,
        warningsCount: 1,
      }),
    );

    writeFileSync(store.indexPath, "{ corrupt-index", "utf8");
    expect(
      store.resolve({
        id: "virtual:routes",
        importer: join(projectRoot, "src/root.ts"),
      }).status,
    ).toBe("hit");
  });

  it("honors the per-artifact lock before writing source or manifest", () => {
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      lockTimeoutMs: 25,
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });
    const importer = join(projectRoot, "src/root.ts");
    const miss = store.resolve({ id: "virtual:routes", importer });
    if (miss.status !== "miss") return;
    const lockPath = `${miss.paths.manifestPath}.lock`;
    mkdirSync(lockPath, { recursive: true });

    expect(() =>
      store.materialize({
        id: "virtual:routes",
        importer,
        sourceText: "export const route = '/locked-child';\n",
      }),
    ).toThrow(/Timed out acquiring artifact lock/);
    expect(existsSync(miss.paths.sourcePath)).toBe(false);
    expect(existsSync(miss.paths.manifestPath)).toBe(false);

    rmSync(lockPath, { recursive: true, force: true });

    store.materialize({
      id: "virtual:routes",
      importer,
      sourceText: "export const route = '/locked-child';\n",
    });
    const resolved = store.resolve({ id: "virtual:routes", importer });
    expect(resolved.status).toBe("hit");
    if (resolved.status !== "hit") return;
    expect(resolved.sourceText).toBe("export const route = '/locked-child';\n");
  });

  it("honors the project index lock before publishing an artifact", () => {
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      lockTimeoutMs: 25,
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });
    mkdirSync(`${store.indexPath}.lock`, { recursive: true });
    const miss = store.resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });
    if (miss.status !== "miss") return;

    expect(() =>
      store.materialize({
        id: "virtual:routes",
        importer: join(projectRoot, "src/root.ts"),
        sourceText: "export const route = '/locked-index';\n",
      }),
    ).toThrow(/Timed out acquiring index lock/);
    expect(existsSync(store.indexPath)).toBe(false);
    expect(existsSync(miss.paths.sourcePath)).toBe(false);
    expect(existsSync(miss.paths.manifestPath)).toBe(false);

    rmSync(`${store.indexPath}.lock`, { recursive: true, force: true });
    materialize();
    expect(store.readProjectIndex().status).toBe("ok");
  });

  it("reuses a manifest-backed artifact after store restart", () => {
    const written = materialize();
    const restarted = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });

    const result = restarted.resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
    });

    expect(result.status).toBe("hit");
    expect(result.logicalIdentity).toBe(written.logicalIdentity);
  });

  it("blocks cache hits when current fingerprints differ or are unavailable", () => {
    materialize();
    const changed = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint("sha256:source-v2")],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    }).resolve({ id: "virtual:routes", importer: join(projectRoot, "src/root.ts") });
    const unavailable = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      fingerprints: {
        sourceInputFingerprints: [
          { kind: "file", name: "src/routes.ts", unavailableReason: "missing source" },
        ],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    }).resolve({ id: "virtual:routes", importer: join(projectRoot, "src/root.ts") });

    expect(changed.status).toBe("invalid");
    expect(changed.reason).toBe("fingerprint-mismatch");
    expect(unavailable.status).toBe("invalid");
    expect(unavailable.reason).toBe("fingerprint-unavailable");
    expect(unavailable.details).toContain("missing source");
  });

  it("blocks cache hits when fingerprints omit correctness hashes", () => {
    materialize();
    const result = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      fingerprints: {
        sourceInputFingerprints: [{ kind: "file", name: "src/routes.ts" }],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    }).resolve({ id: "virtual:routes", importer: join(projectRoot, "src/root.ts") });

    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("fingerprint-unavailable");
    expect(result.details).toContain("src/routes.ts fingerprint hash is unavailable");
  });

  it("blocks cache hits when current fingerprints explicitly provide an empty group", () => {
    materialize();

    const result = createStore().resolve({
      id: "virtual:routes",
      importer: join(projectRoot, "src/root.ts"),
      fingerprints: {
        sourceInputFingerprints: [],
      },
    });

    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("fingerprint-unavailable");
    expect(result.details).toContain("Source input fingerprints are unavailable");
  });

  it("blocks reusable hits when callers omit correctness fingerprints", () => {
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "unsafe-routes",
    });
    const importer = join(projectRoot, "src/root.ts");
    store.materialize({
      id: "virtual:unsafe-routes",
      importer,
      sourceText: "export const route = '/unsafe';\n",
    });

    const result = store.resolve({ id: "virtual:unsafe-routes", importer });

    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("fingerprint-unavailable");
  });

  it("recovers stale artifact locks left by dead writers", () => {
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      lockTimeoutMs: 25,
      staleLockMs: 0,
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });
    const importer = join(projectRoot, "src/root.ts");
    const miss = store.resolve({ id: "virtual:routes", importer });
    if (miss.status !== "miss") return;
    const lockPath = `${miss.paths.manifestPath}.lock`;
    mkdirSync(lockPath, { recursive: true });
    writeFileSync(join(lockPath, "lock.json"), JSON.stringify({ pid: -1, createdAt: 0 }), "utf8");

    store.materialize({
      id: "virtual:routes",
      importer,
      sourceText: "export const route = '/recovered-lock';\n",
    });

    const resolved = store.resolve({ id: "virtual:routes", importer });
    expect(resolved.status).toBe("hit");
    if (resolved.status !== "hit") return;
    expect(resolved.sourceText).toBe("export const route = '/recovered-lock';\n");
  });

  it("does not release a stale lock replacement owned by another writer", () => {
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed/app",
      virtualKey: "routes-key",
      lockTimeoutMs: 25,
      staleLockMs: 0,
      fingerprints: {
        sourceInputFingerprints: [sourceFingerprint()],
        pluginFingerprints: [pluginFingerprint()],
        compilerFingerprints: [compilerFingerprint()],
      },
    });
    const importer = join(projectRoot, "src/root.ts");
    const miss = store.resolve({ id: "virtual:routes", importer });
    if (miss.status !== "miss") return;
    const lockPath = `${miss.paths.manifestPath}.lock`;
    mkdirSync(lockPath, { recursive: true });
    writeFileSync(
      join(lockPath, "lock.json"),
      JSON.stringify({ createdAt: Date.now(), ownerToken: "replacement-writer" }),
      "utf8",
    );

    expect(() => store.__unsafeReleaseLockForTesting(lockPath, "original-writer")).not.toThrow();
    expect(existsSync(lockPath)).toBe(true);
    expect(() =>
      createVirtualArtifactStore({
        projectRoot,
        pluginName: "typed/app",
        virtualKey: "routes-key",
        lockTimeoutMs: 25,
        staleLockMs: 60_000,
        fingerprints: {
          sourceInputFingerprints: [sourceFingerprint()],
          pluginFingerprints: [pluginFingerprint()],
          compilerFingerprints: [compilerFingerprint()],
        },
      }).materialize({
        id: "virtual:routes",
        importer,
        sourceText: "export const route = '/blocked-by-replacement';\n",
      }),
    ).toThrow(/Timed out acquiring artifact lock/);
  });

  it("uses temp-file rename writes so concurrent materialization leaves a valid last writer", () => {
    const store = createStore();
    const importer = join(projectRoot, "src/root.ts");
    const first = store.materialize({
      id: "virtual:routes",
      importer,
      sourceText: "export const route = '/first';\n",
      diagnostics: [{ severity: "info", message: "first" }],
    });
    const second = store.materialize({
      id: "virtual:routes",
      importer,
      sourceText: "export const route = '/second';\n",
      diagnostics: [{ severity: "info", message: "second" }],
    });
    const result = store.resolve({ id: "virtual:routes", importer });

    expect(first.logicalIdentity).toBe(second.logicalIdentity);
    expect(result.status).toBe("hit");
    if (result.status !== "hit") return;
    expect(result.sourceText).toBe("export const route = '/second';\n");
    expect(result.manifest.generatedSourceHash).toBe(createGeneratedSourceHash(result.sourceText));
    expect(
      readFileSync(result.paths.manifestPath, "utf8").includes(
        createGeneratedSourceHash("export const route = '/second';\n"),
      ),
    ).toBe(true);
    expect(
      readdirSync(dirname(result.paths.sourcePath)).filter((name) => name.endsWith(".tmp")),
    ).toEqual([]);
  });

  it("reads manifests directly by logical identity", () => {
    const written = materialize();
    const result = createStore().readManifest(written.logicalIdentity);

    expect(result).toEqual({
      status: "ok",
      manifest: expect.objectContaining({
        logicalIdentity: written.logicalIdentity,
        virtualId: "virtual:routes",
      }),
    });
  });
});
