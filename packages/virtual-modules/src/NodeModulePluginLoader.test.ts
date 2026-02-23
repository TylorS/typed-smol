import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { NodeModulePluginLoader } from "./NodeModulePluginLoader.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "typed-virtual-modules-"));
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

describe("NodeModulePluginLoader", () => {
  it("accepts preloaded plugin objects", () => {
    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      name: "preloaded",
      shouldResolve: () => true,
      build: () => "export const x = 1;",
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.plugin.name).toBe("preloaded");
  });

  it("loads an ESM module by explicit path", () => {
    const dir = createTempDir();
    const filePath = join(dir, "plugin.mjs");
    writeFileSync(
      filePath,
      `export default { name: "esm", shouldResolve: () => true, build: () => "export const esm = true;" };`,
      "utf8",
    );

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./plugin.mjs",
      baseDir: dir,
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.plugin.name).toBe("esm");
    expect(result.resolvedPath.endsWith("plugin.mjs")).toBe(true);
  });

  it("loads a synchronous ESM module with default export", () => {
    const dir = createTempDir();
    const filePath = join(dir, "plugin.mjs");
    writeFileSync(
      filePath,
      `export default { name: "esm-default", shouldResolve: () => true, build: () => "export const esm = true;" };`,
      "utf8",
    );

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./plugin.mjs",
      baseDir: dir,
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.plugin.name).toBe("esm-default");
    expect(result.resolvedPath.endsWith("plugin.mjs")).toBe(true);
  });

  it("loads a synchronous ESM module with named plugin export", () => {
    const dir = createTempDir();
    const filePath = join(dir, "plugin-named.mjs");
    writeFileSync(
      filePath,
      `export const plugin = { name: "esm-named", shouldResolve: () => true, build: () => "export const esm = true;" };`,
      "utf8",
    );

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./plugin-named.mjs",
      baseDir: dir,
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.plugin.name).toBe("esm-named");
  });

  it("returns module-load-failed for async ESM (top-level await)", () => {
    const dir = createTempDir();
    const filePath = join(dir, "plugin-async.mjs");
    writeFileSync(
      filePath,
      `await Promise.resolve(); export default { name: "esm-async", shouldResolve: () => true, build: () => "export const esm = true;" };`,
      "utf8",
    );

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./plugin-async.mjs",
      baseDir: dir,
    });

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("module-load-failed");
    expect(result.message.toLowerCase()).toContain("await");
  });

  it("returns structured error for invalid exports", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "bad.mjs"), `export default { nope: true };`, "utf8");

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./bad.mjs",
      baseDir: dir,
    });

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("invalid-plugin-export");
  });

  it("returns invalid-request for empty baseDir", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "p.mjs"),
      `export default { name: "p", shouldResolve: () => true, build: () => "" };`,
      "utf8",
    );
    const loader = new NodeModulePluginLoader();
    const result = loader.load({ specifier: "./p.mjs", baseDir: "" });
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("invalid-request");
  });

  it("returns invalid-request for empty specifier", () => {
    const dir = createTempDir();
    const loader = new NodeModulePluginLoader();
    const result = loader.load({ specifier: "", baseDir: dir });
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("invalid-request");
  });

  it("returns module-not-found for non-existent specifier", () => {
    const dir = createTempDir();
    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./does-not-exist-12345.mjs",
      baseDir: dir,
    });
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("module-not-found");
  });
});
