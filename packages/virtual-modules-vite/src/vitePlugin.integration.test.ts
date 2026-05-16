import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  createTypeInfoApiSession,
  PluginManager,
  type VirtualArtifactManifest,
  type VirtualModulePlugin,
} from "@typed/virtual-modules";
import { createServer } from "vite";
import { encodeVirtualId } from "./encodeVirtualId.js";
import { virtualModulesVitePlugin } from "./vitePlugin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const vmcCliPath = join(__dirname, "..", "..", "virtual-modules-compiler", "dist", "cli.js");
const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "virtual-modules-vite-"));
  tempDirs.push(dir);
  return dir;
}

function runVmcNoEmit(cwd: string): { readonly exitCode: number; readonly stderr: string } {
  ensureVmcCliBuilt();
  const result = spawnSync("node", [vmcCliPath, "--noEmit"], {
    cwd,
    encoding: "utf8",
    timeout: 15_000,
  });
  return {
    exitCode: result.status ?? (result.signal ? 1 : 0),
    stderr: result.stderr ?? "",
  };
}

function ensureVmcCliBuilt(): void {
  if (existsSync(vmcCliPath)) return;

  for (const [pkg, label] of [
    ["@typed/virtual-modules", "@typed/virtual-modules build"],
    ["@typed/virtual-modules-compiler", "@typed/virtual-modules-compiler build"],
  ] as const) {
    const build = spawnSync("pnpm", ["--filter", pkg, "build"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 30_000,
    });
    if (build.status !== 0) {
      const output = [build.stdout, build.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`${label} failed:\n${output}`);
    }
  }
}

function readSingleArtifactManifest(projectRoot: string): VirtualArtifactManifest {
  const indexPath = join(projectRoot, "node_modules", ".typed", "virtual", "index.json");
  const index = parseVirtualArtifactIndex(JSON.parse(readFileSync(indexPath, "utf8")));
  expect(index.ok, index.ok ? "" : index.reason).toBe(true);
  const artifacts = index.ok ? Object.values(index.index.artifacts) : [];
  expect(artifacts).toHaveLength(1);
  const artifactEntry = artifacts[0];
  expect(artifactEntry).toBeDefined();
  expect(artifactEntry?.virtualId).toBe("virtual:foo");
  const manifest = parseVirtualArtifactManifest(
    JSON.parse(readFileSync(artifactEntry!.manifestPath, "utf8")),
  );
  expect(manifest.ok, manifest.ok ? "" : manifest.reason).toBe(true);
  if (!manifest.ok) throw new Error(manifest.reason);
  expect(manifest.manifest.virtualId).toBe("virtual:foo");
  return manifest.manifest;
}

function toViteVirtualUrl(base: string, id: string): string {
  return base + "/@id/" + id.split(String.fromCharCode(0)).join("__x00__");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

/**
 * Virtual module that uses TypeInfoApi.file() to read a single file's type snapshot
 * and exports the list of export names.
 */
function fileSnapshotPlugin(): VirtualModulePlugin {
  return {
    name: "file-snapshot",
    shouldResolve(id: string): boolean {
      return id === "virtual:file-snapshot";
    },
    build(_id: string, importer: string, api): string {
      const baseDir = dirname(importer);
      const result = api.file("types.ts", { baseDir });
      if (!result.ok) {
        return `export const fileExportNames = []; export const fileError = ${JSON.stringify(result.error)};`;
      }
      const names = result.snapshot.exports.map((e) => e.name);
      return `export const fileExportNames = ${JSON.stringify(names)};`;
    },
  };
}

/**
 * Virtual module that uses TypeInfoApi.directory() to list type snapshots in a directory
 * and exports the relative file paths.
 */
function dirSnapshotPlugin(): VirtualModulePlugin {
  return {
    name: "dir-snapshot",
    shouldResolve(id: string): boolean {
      return id === "virtual:dir-snapshot";
    },
    build(_id: string, importer: string, api): string {
      const srcDir = dirname(importer);
      const baseDir = join(srcDir, "features");
      const snapshots = api.directory("*.ts", {
        baseDir,
        recursive: true,
      });
      const filePaths = snapshots.map((s) => s.filePath);
      return `export const dirFilePaths = ${JSON.stringify(filePaths)};`;
    },
  };
}

describe("virtualModulesVitePlugin integration", () => {
  it("serves virtual module content in dev (static virtual module)", async () => {
    const projectRoot = createTempDir();
    const srcDir = join(projectRoot, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      join(projectRoot, "index.html"),
      `<!DOCTYPE html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      "utf8",
    );
    writeFileSync(
      join(srcDir, "main.ts"),
      'import { value } from "virtual:static";\nexport const out = value;',
      "utf8",
    );
    const manager = new PluginManager([
      {
        name: "static",
        shouldResolve: (id) => id === "virtual:static",
        build: () => 'export const value = "from-virtual";',
      },
    ]);
    const server = await createServer({
      root: projectRoot,
      plugins: [virtualModulesVitePlugin({ resolver: manager })],
      server: { port: 0 },
      logLevel: "warn",
    });
    await server.listen();
    try {
      const base = `http://localhost:${server.config.server.port}`;
      const mainRes = await fetch(`${base}/src/main.ts`);
      expect(mainRes.ok).toBe(true);
      const mainText = await mainRes.text();
      expect(mainText).toContain("out");
      const importer = join(projectRoot, "src", "main.ts");
      const resolvedId = encodeVirtualId("virtual:static", importer);
      const virtualPath = "/@id/" + resolvedId.split(String.fromCharCode(0)).join("__x00__");
      const virtualRes = await fetch(base + virtualPath);
      expect(virtualRes.ok).toBe(true);
      const virtualText = await virtualRes.text();
      expect(virtualText).toContain("from-virtual");
      const indexPath = join(projectRoot, "node_modules", ".typed", "virtual", "index.json");
      expect(existsSync(indexPath)).toBe(true);
      const index = parseVirtualArtifactIndex(JSON.parse(readFileSync(indexPath, "utf8")));
      expect(index.ok).toBe(true);
      const artifactEntry = index.ok ? Object.values(index.index.artifacts)[0] : undefined;
      expect(artifactEntry?.generatedSourcePath).toContain(
        join(projectRoot, "node_modules", ".typed", "virtual"),
      );
      expect(readFileSync(artifactEntry!.generatedSourcePath, "utf8")).toContain("from-virtual");
      await server.waitForRequestsIdle();
    } finally {
      await server.close();
    }
  });

  it("reuses vmc-written artifacts in Vite dev when manifest fingerprints match", async () => {
    const projectRoot = createTempDir();
    const srcDir = join(projectRoot, "src");
    mkdirSync(srcDir, { recursive: true });
    const importer = join(srcDir, "main.ts");
    writeFileSync(
      join(projectRoot, "index.html"),
      `<!DOCTYPE html><html><body><script type="module" src="/src/main.ts"></script></body></html>`,
      "utf8",
    );
    writeFileSync(
      join(projectRoot, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["src/main.ts"],
      }),
      "utf8",
    );
    writeFileSync(
      join(projectRoot, "vmc.config.ts"),
      `export default {
  plugins: [{
    name: "cross-surface",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export const value = 'from-vmc';",
  }],
};
`,
      "utf8",
    );
    writeFileSync(
      importer,
      'import { value } from "virtual:foo";\nexport const out = value;\n',
      "utf8",
    );

    const vmc = runVmcNoEmit(projectRoot);
    expect(vmc.stderr).toBe("");
    expect(vmc.exitCode).toBe(0);
    const manifest = readSingleArtifactManifest(projectRoot);
    expect(readFileSync(manifest.generatedSourcePath, "utf8")).toContain("from-vmc");

    let buildCount = 0;
    const manager = new PluginManager([
      {
        name: "cross-surface",
        shouldResolve: (id) => id === "virtual:foo",
        build: () => {
          buildCount += 1;
          throw new Error("Vite should reuse the vmc-written artifact");
        },
      },
    ]);
    const server = await createServer({
      root: projectRoot,
      plugins: [
        virtualModulesVitePlugin({
          resolver: manager,
          projectRoot,
          artifactStore: {
            fingerprints: {
              pluginFingerprints: manifest.pluginFingerprints,
              compilerFingerprints: manifest.compilerFingerprints,
            },
          },
        }),
      ],
      server: { port: 0 },
      logLevel: "warn",
    });
    await server.listen();
    try {
      const base = `http://localhost:${server.config.server.port}`;
      const resolvedId = encodeVirtualId("virtual:foo", manifest.effectiveImporter);
      const virtualRes = await fetch(toViteVirtualUrl(base, resolvedId));
      expect(virtualRes.ok).toBe(true);
      const virtualText = await virtualRes.text();
      expect(virtualText).toContain("from-vmc");
      expect(buildCount).toBe(0);
      await server.waitForRequestsIdle();
    } finally {
      await server.close();
    }
  });

  it("serves virtual modules backed by api.file() and api.directory() in dev", async () => {
    const projectRoot = createTempDir();
    const srcDir = join(projectRoot, "src");
    const featuresDir = join(projectRoot, "src", "features");
    mkdirSync(featuresDir, { recursive: true });

    writeFileSync(
      join(projectRoot, "index.html"),
      `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script type="module" src="/src/main.ts"></script></body></html>`,
      "utf8",
    );
    writeFileSync(
      join(projectRoot, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
        include: ["src"],
      }),
      "utf8",
    );
    writeFileSync(join(srcDir, "types.ts"), `export type X = string; export const y = 42;`, "utf8");
    writeFileSync(
      join(srcDir, "main.ts"),
      [
        'import { fileExportNames } from "virtual:file-snapshot";',
        'import { dirFilePaths } from "virtual:dir-snapshot";',
        "export const fileExportNamesFromFile = fileExportNames;",
        "export const dirFilePathsFromDir = dirFilePaths;",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(join(featuresDir, "one.ts"), `export const one = "one";`, "utf8");
    writeFileSync(join(featuresDir, "two.ts"), `export const two = "two";`, "utf8");

    const rootFiles = [
      join(srcDir, "main.ts"),
      join(srcDir, "types.ts"),
      join(featuresDir, "one.ts"),
      join(featuresDir, "two.ts"),
    ];
    const program = ts.createProgram(rootFiles, {
      strict: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      noEmit: true,
    });

    const createSession = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([fileSnapshotPlugin(), dirSnapshotPlugin()]);

    const server = await createServer({
      root: projectRoot,
      plugins: [
        virtualModulesVitePlugin({
          resolver: manager,
          createTypeInfoApiSession: createSession,
          warnOnError: true,
        }),
      ],
      server: { port: 0 },
      logLevel: "warn",
    });
    await server.listen();
    try {
      const base = `http://localhost:${server.config.server.port}`;
      const mainRes = await fetch(`${base}/src/main.ts`);
      expect(mainRes.ok).toBe(true);
      const mainText = await mainRes.text();
      expect(mainText).toContain("fileExportNamesFromFile");
      expect(mainText).toContain("dirFilePathsFromDir");
      const importer = join(projectRoot, "src", "main.ts");
      const fileResolvedId = encodeVirtualId("virtual:file-snapshot", importer);
      const dirResolvedId = encodeVirtualId("virtual:dir-snapshot", importer);
      const fileSnapshotRes = await fetch(toViteVirtualUrl(base, fileResolvedId));
      expect(fileSnapshotRes.ok).toBe(true);
      const fileSnapshotText = await fileSnapshotRes.text();
      expect(fileSnapshotText).toContain("fileExportNames");
      expect(fileSnapshotText).toMatch(/"X".*"y"/);

      const dirSnapshotRes = await fetch(toViteVirtualUrl(base, dirResolvedId));
      expect(dirSnapshotRes.ok).toBe(true);
      const dirSnapshotText = await dirSnapshotRes.text();
      expect(dirSnapshotText).toContain("dirFilePaths");
      expect(dirSnapshotText).toContain("one.ts");
      expect(dirSnapshotText).toContain("two.ts");
      await server.waitForRequestsIdle();
    } finally {
      await server.close();
    }
  });
});
