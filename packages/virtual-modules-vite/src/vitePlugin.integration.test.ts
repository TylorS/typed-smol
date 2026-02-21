import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTypeInfoApiSession,
  PluginManager,
  type VirtualModulePlugin,
} from "@typed/virtual-modules";
import { createServer } from "vite";
import { encodeVirtualId } from "./encodeVirtualId.js";
import { virtualModulesVitePlugin } from "./vitePlugin.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "virtual-modules-vite-"));
  tempDirs.push(dir);
  return dir;
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
      const toUrl = (id: string) =>
        base + "/@id/" + id.split(String.fromCharCode(0)).join("__x00__");
      const fileSnapshotRes = await fetch(toUrl(fileResolvedId));
      expect(fileSnapshotRes.ok).toBe(true);
      const fileSnapshotText = await fileSnapshotRes.text();
      expect(fileSnapshotText).toContain("fileExportNames");
      expect(fileSnapshotText).toMatch(/"X".*"y"/);

      const dirSnapshotRes = await fetch(toUrl(dirResolvedId));
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
