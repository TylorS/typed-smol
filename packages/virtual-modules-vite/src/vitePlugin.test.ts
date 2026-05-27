import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPluginConfigFingerprint,
  createSourceInputFingerprint,
  createVirtualArtifactStore,
  PluginManager,
  type ArtifactStoreFingerprints,
  type VirtualModuleBuildContext,
} from "@typed/virtual-modules";
import { encodeVirtualId } from "./encodeVirtualId.js";
import { virtualModulesVitePlugin } from "./vitePlugin.js";

type ResolveId = (specifier: string, importer: string | undefined) => string | null;
type Load = (specifier: string) => Promise<{ code: string } | null>;

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "virtual-modules-vite-"));
  tempDirs.push(dir);
  return dir;
};

const createCacheFingerprints = (): ArtifactStoreFingerprints => ({
  pluginFingerprints: [createPluginConfigFingerprint("vite-test-plugin", { version: 1 })],
  compilerFingerprints: [createPluginConfigFingerprint("vite-test-compiler", { version: 1 })],
});

const loadCode = async (load: Load, id: string): Promise<string | undefined> =>
  (await load(id))?.code;

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("virtualModulesVitePlugin", () => {
  it("returns a plugin with name and enforce pre", () => {
    const manager = new PluginManager();
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    expect(plugin.name).toBe("virtual-modules");
    expect(plugin.enforce).toBe("pre");
  });

  it("resolveId returns null when importer is undefined", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: () => true,
        build: () => "export {};",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    expect(resolveId("virtual:x", undefined)).toBeNull();
  });

  it("resolveId ignores Vite internal null-byte importers before resolver validation", () => {
    let shouldResolveCalls = 0;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: () => {
          shouldResolveCalls += 1;
          return true;
        },
        build: () => "export {};",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;

    expect(resolveId("typed:server?routes=./routes", "\0vite/internal.js")).toBeNull();
    expect(shouldResolveCalls).toBe(0);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("resolveId ignores Vite internal null-byte ids before resolver validation", () => {
    let shouldResolveCalls = 0;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: () => {
          shouldResolveCalls += 1;
          return true;
        },
        build: () => "export {};",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;

    expect(resolveId("\0virtual:already-resolved", "/app/main.ts")).toBeNull();
    expect(shouldResolveCalls).toBe(0);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("resolveId stays silent when resolver rejects null-byte payloads", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const manager = new PluginManager();
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;

    expect(resolveId("typed:router?dir=./routes", "\0vite/internal.js")).toBeNull();
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("resolveId returns encoded id when resolver resolves", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: (id) => id === "virtual:config",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const out = resolveId("virtual:config", "/app/main.ts");
    expect(out).not.toBeNull();
    expect(typeof out).toBe("string");
    expect((out as string).startsWith("\0virtual:")).toBe(true);
  });

  it("maps virtual ids with the current Vite environment before resolution", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: (id) => id === "virtual:config?mode=client",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      mapId: ({ id, consumer }) => (consumer === "client" ? `${id}?mode=client` : id),
    });
    const resolveId = plugin.resolveId! as ResolveId;
    const out = resolveId.call(
      { environment: { name: "client", config: { consumer: "client" } } },
      "virtual:config",
      "/app/main.ts",
    );

    expect(out).toBe(encodeVirtualId("virtual:config?mode=client", "/app/main.ts"));
  });

  it("passes exact requested exports during build", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { Client } from "virtual:api";\nconsole.log(Client);', "utf8");
    let context: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "api",
        shouldResolve: (id) => id === "virtual:api",
        build: (_id, _importer, _api, buildContext) => {
          context = buildContext;
          return "export const Client = 1;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager, projectRoot });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const resolvedId = (plugin.resolveId! as ResolveId)("virtual:api", importer) as string;

    await (plugin.load! as Load)(resolvedId);

    expect(context?.requestedExports).toEqual({
      kind: "names",
      names: new Set(["Client"]),
      typeOnlyNames: new Set(),
    });
    expect(context?.closure).toEqual({
      kind: "partial",
      requested: new Set(["Client"]),
      pluginDeclared: new Set(),
      typeInfoReachable: new Set(),
      routeOrAppReachable: new Set(),
    });
  });

  it("analyzes requested exports against the source import before mapped-id resolution", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { makeClient } from "virtual:api";\nvoid makeClient;', "utf8");
    let context: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "api",
        shouldResolve: (id) => id === "virtual:api?mode=client",
        build: (_id, _importer, _api, buildContext) => {
          context = buildContext;
          return "export const makeClient = 1;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      mapId: ({ id, consumer }) => (consumer === "client" ? `${id}?mode=client` : id),
    });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const resolvedId = plugin.resolveId!.call(
      { environment: { name: "client", config: { consumer: "client" } } },
      "virtual:api",
      importer,
    ) as string;

    await (plugin.load! as Load)(resolvedId);

    expect(context?.id).toBe("virtual:api?mode=client");
    expect(context?.requestedExports).toEqual({
      kind: "names",
      names: new Set(["makeClient"]),
      typeOnlyNames: new Set(),
    });
  });

  it("analyzes requested exports from already-loaded virtual parent modules", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { entry } from "virtual:parent";\nvoid entry;', "utf8");
    let childContext: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "parent",
        shouldResolve: (id) => id === "virtual:parent",
        build: () => 'import { ApiLayer, DependenciesLayer } from "virtual:api";\nexport const entry = [ApiLayer, DependenciesLayer];',
      },
      {
        name: "api",
        shouldResolve: (id) => id === "virtual:api",
        build: (_id, _importer, _api, buildContext) => {
          childContext = buildContext;
          return "export const ApiLayer = 1; export const DependenciesLayer = 2;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager, projectRoot });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const parentId = (plugin.resolveId! as ResolveId)("virtual:parent", importer) as string;
    await (plugin.load! as Load)(parentId);
    const childId = (plugin.resolveId! as ResolveId)("virtual:api", parentId) as string;

    await (plugin.load! as Load)(childId);

    expect(childContext?.requestedExports).toEqual({
      kind: "names",
      names: new Set(["ApiLayer", "DependenciesLayer"]),
      typeOnlyNames: new Set(),
    });
  });

  it("uses all requested exports during dev", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { Client } from "virtual:api";\nconsole.log(Client);', "utf8");
    let context: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "api",
        shouldResolve: (id) => id === "virtual:api",
        build: (_id, _importer, _api, buildContext) => {
          context = buildContext;
          return "export const Client = 1;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager, projectRoot });
    plugin.configResolved?.({ root: projectRoot, command: "serve" } as never);
    const resolvedId = (plugin.resolveId! as ResolveId)("virtual:api", importer) as string;

    await (plugin.load! as Load)(resolvedId);

    expect(context?.requestedExports).toEqual({ kind: "all", reason: "dev mode" });
    expect(context?.closure).toEqual({ kind: "all", reason: "dev mode" });
  });

  it("falls back to all requested exports when importer source is unavailable", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "missing.ts");
    let context: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "api",
        shouldResolve: (id) => id === "virtual:api",
        build: (_id, _importer, _api, buildContext) => {
          context = buildContext;
          return "export const Client = 1;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager, projectRoot });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const resolvedId = (plugin.resolveId! as ResolveId)("virtual:api", importer) as string;

    await (plugin.load! as Load)(resolvedId);

    expect(context?.requestedExports).toEqual({
      kind: "all",
      reason: "importer source unavailable",
    });
    expect(context?.closure).toEqual({ kind: "all", reason: "importer source unavailable" });
  });

  it("falls back to all requested exports when the containing file is virtual", async () => {
    const projectRoot = createTempDir();
    const rootImporter = join(projectRoot, "src", "main.ts");
    const virtualImporter = encodeVirtualId("virtual:parent", rootImporter);
    let context: VirtualModuleBuildContext | undefined;
    const manager = new PluginManager([
      {
        name: "nested",
        shouldResolve: (id) => id === "virtual:nested",
        build: (_id, _importer, _api, buildContext) => {
          context = buildContext;
          return "export const nested = 1;";
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager, projectRoot });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const resolvedId = (plugin.resolveId! as ResolveId)(
      "virtual:nested",
      virtualImporter,
    ) as string;

    await (plugin.load! as Load)(resolvedId);

    expect(context?.rootImporter).toBe(rootImporter);
    expect(context?.containingFile).toBe(virtualImporter);
    expect(context?.requestedExports).toEqual({
      kind: "all",
      reason: "virtual importer source unavailable",
    });
    expect(context?.closure).toEqual({
      kind: "all",
      reason: "virtual importer source unavailable",
    });
  });

  it("fingerprints production closure context for artifact reuse", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:closure";', "utf8");
    const fingerprints = createCacheFingerprints();
    const staleStore = createVirtualArtifactStore({
      projectRoot,
      pluginName: "closure",
      fingerprints,
    });
    staleStore.materialize({
      id: "virtual:closure",
      importer,
      sourceText: 'export const value = "stale";',
      sourceInputFingerprints: [createSourceInputFingerprint(importer)],
    });
    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "closure",
        shouldResolve: (id) => id === "virtual:closure",
        build: () => {
          buildCount += 1;
          return 'export const value = "fresh";';
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      artifactStore: { fingerprints },
    });
    plugin.configResolved?.({ root: projectRoot, command: "build" } as never);
    const resolvedId = (plugin.resolveId! as ResolveId)("virtual:closure", importer) as string;

    const code = await loadCode(plugin.load! as Load, resolvedId);

    expect(code).toContain('const value = "fresh";');
    expect(buildCount).toBe(1);
  });

  it("load returns transpiled sourceText for encoded virtual id", async () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: (id) => id === "virtual:config",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const load = plugin.load! as Load;
    const resolvedId = resolveId("virtual:config", "/app/main.ts") as string;
    await expect(loadCode(load, resolvedId)).resolves.toContain("const x = 1;");
  });

  it("load returns persisted artifact hits without running plugin build", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:cached";', "utf8");
    const fingerprints = createCacheFingerprints();
    const artifactStore = createVirtualArtifactStore({
      projectRoot,
      pluginName: "cached",
      fingerprints,
    });
    artifactStore.materialize({
      id: "virtual:cached",
      importer,
      sourceText: 'export const value = "from-artifact";',
      sourceInputFingerprints: [createSourceInputFingerprint(importer)],
    });
    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "cached",
        shouldResolve: (id) => id === "virtual:cached",
        build: () => {
          buildCount += 1;
          throw new Error("artifact hit should not rebuild");
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      artifactStore: { fingerprints },
    });
    const resolveId = plugin.resolveId! as ResolveId;
    const load = plugin.load! as Load;

    const resolvedId = resolveId("virtual:cached", importer) as string;
    expect(resolvedId).toBe(encodeVirtualId("virtual:cached", importer));
    const code = await loadCode(load, resolvedId);

    expect(code).toContain('const value = "from-artifact";');
    expect(buildCount).toBe(0);
  });

  it("load rebuilds missing artifacts and persists the generated source", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:fresh";', "utf8");
    const fingerprints = createCacheFingerprints();
    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "fresh",
        shouldResolve: (id) => id === "virtual:fresh",
        build: () => {
          buildCount += 1;
          return 'export const value = "from-build";';
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      artifactStore: { fingerprints },
    });
    const load = plugin.load! as Load;
    const resolvedId = encodeVirtualId("virtual:fresh", importer);

    const firstCode = await loadCode(load, resolvedId);
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "fresh",
      fingerprints,
    });
    const artifact = store.resolve({
      id: "virtual:fresh",
      importer,
      fingerprints: {
        sourceInputFingerprints: [createSourceInputFingerprint(importer)],
      },
    });

    expect(firstCode).toContain('const value = "from-build";');
    expect(buildCount).toBe(1);
    expect(artifact.status).toBe("hit");
    expect(artifact.status === "hit" ? artifact.sourceText : "").toBe(
      'export const value = "from-build";',
    );
  });

  it("load rebuilds invalid artifacts before returning source", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:stale";', "utf8");
    const fingerprints = createCacheFingerprints();
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "stale",
      fingerprints,
    });
    const materialized = store.materialize({
      id: "virtual:stale",
      importer,
      sourceText: 'export const value = "old";',
      sourceInputFingerprints: [createSourceInputFingerprint(importer)],
    });
    writeFileSync(materialized.paths.sourcePath, 'export const value = "tampered";', "utf8");
    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "stale",
        shouldResolve: (id) => id === "virtual:stale",
        build: () => {
          buildCount += 1;
          return 'export const value = "rebuilt";';
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      artifactStore: { fingerprints },
    });
    const load = plugin.load! as Load;

    const code = await loadCode(load, encodeVirtualId("virtual:stale", importer));
    const artifact = store.resolve({
      id: "virtual:stale",
      importer,
      fingerprints: {
        sourceInputFingerprints: [createSourceInputFingerprint(importer)],
      },
    });

    expect(code).toContain('const value = "rebuilt";');
    expect(buildCount).toBe(1);
    expect(artifact.status === "hit" ? artifact.sourceText : "").toBe(
      'export const value = "rebuilt";',
    );
  });

  it("load fails closed without explicit Vite plugin fingerprints", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:dynamic";', "utf8");
    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "dynamic",
        shouldResolve: (id) => id === "virtual:dynamic",
        build: () => {
          buildCount += 1;
          return `export const value = ${buildCount};`;
        },
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
    });
    const load = plugin.load! as Load;
    const resolvedId = encodeVirtualId("virtual:dynamic", importer);

    const firstCode = await loadCode(load, resolvedId);
    const secondCode = await loadCode(load, resolvedId);

    expect(firstCode).toContain("const value = 1;");
    expect(secondCode).toContain("const value = 2;");
    expect(buildCount).toBe(2);
  });

  it("load transpiles TypeScript while materializing typed artifacts", async () => {
    const projectRoot = createTempDir();
    const importer = join(projectRoot, "src", "main.ts");
    mkdirSync(join(projectRoot, "src"), { recursive: true });
    writeFileSync(importer, 'import { value } from "virtual:typed";', "utf8");
    const fingerprints = createCacheFingerprints();
    const sourceText = "type Value = number;\nexport const value: Value = 1;\n";
    const manager = new PluginManager([
      {
        name: "typed",
        shouldResolve: (id) => id === "virtual:typed",
        build: () => sourceText,
      },
    ]);
    const plugin = virtualModulesVitePlugin({
      resolver: manager,
      projectRoot,
      artifactStore: { fingerprints },
    });
    const load = plugin.load! as Load;
    const resolvedId = encodeVirtualId("virtual:typed", importer);

    const code = await loadCode(load, resolvedId);
    const store = createVirtualArtifactStore({
      projectRoot,
      pluginName: "typed",
      fingerprints,
    });
    const artifact = store.resolve({
      id: "virtual:typed",
      importer,
      fingerprints: {
        sourceInputFingerprints: [createSourceInputFingerprint(importer)],
      },
    });

    expect(code).toContain("const value = 1;");
    expect(artifact.status === "hit" ? artifact.sourceText : "").toBe(sourceText);
  });

  it("resolveId with encoded virtual id as importer resolves virtual-to-virtual import", async () => {
    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: () => `import { x } from "virtual:b"; export { x };`,
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const load = plugin.load! as Load;
    const rootImporter = "/app/main.ts";
    const encodedA = encodeVirtualId("virtual:a", rootImporter);
    const resolvedB = resolveId("virtual:b", encodedA);
    expect(resolvedB).not.toBeNull();
    await expect(loadCode(load, resolvedB as string)).resolves.toContain("const x = 1;");
  });
});
