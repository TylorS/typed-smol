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

  it("loads a CommonJS module by explicit path", () => {
    const dir = createTempDir();
    const filePath = join(dir, "plugin.cjs");
    writeFileSync(
      filePath,
      `module.exports = { name: "cjs", shouldResolve: () => true, build: () => "export const cjs = true;" };`,
      "utf8",
    );

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./plugin.cjs",
      baseDir: dir,
    });

    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.plugin.name).toBe("cjs");
    expect(result.resolvedPath.endsWith("plugin.cjs")).toBe(true);
  });

  it("returns structured error for invalid exports", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "bad.cjs"), `module.exports = { nope: true };`, "utf8");

    const loader = new NodeModulePluginLoader();
    const result = loader.load({
      specifier: "./bad.cjs",
      baseDir: dir,
    });

    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("invalid-plugin-export");
  });

  it("returns invalid-request for empty baseDir", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "p.cjs"),
      `module.exports = { name: "p", shouldResolve: () => true, build: () => "" };`,
      "utf8",
    );
    const loader = new NodeModulePluginLoader();
    const result = loader.load({ specifier: "./p.cjs", baseDir: "" });
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
      specifier: "./does-not-exist-12345.cjs",
      baseDir: dir,
    });
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.code).toBe("module-not-found");
  });
});
