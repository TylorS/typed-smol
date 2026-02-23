import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { loadVmcConfig } from "./VmcConfigLoader.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "typed-vmc-config-"));
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
        // ignore cleanup failures in test temp dirs
      }
    }
  }
});

describe("loadVmcConfig", () => {
  it("returns not-found when vmc config does not exist", () => {
    const dir = createTempDir();
    const result = loadVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("not-found");
  });

  it("loads vmc.config.ts with default export", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `const plugin = {
  name: "virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export const value = 1;",
};

export default {
  plugins: [plugin, "./plugin.mjs"],
};
`,
      "utf8",
    );

    const result = loadVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;
    expect(result.path.endsWith("vmc.config.ts")).toBe(true);
    expect(result.config.plugins).toBeDefined();
    expect(result.config.plugins).toHaveLength(2);
    const first = result.config.plugins?.[0];
    const second = result.config.plugins?.[1];
    expect(typeof first).toBe("object");
    expect(typeof second).toBe("string");
  });

  it("returns error when configPath is not a string", () => {
    const dir = createTempDir();
    const result = loadVmcConfig({
      projectRoot: dir,
      ts,
      configPath: 123 as unknown as string,
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("configPath must be a string");
    }
  });

  it("returns error when configPath is not a .ts file", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "vmc.config.mjs"), `export default { plugins: [] };`, "utf8");
    const result = loadVmcConfig({
      projectRoot: dir,
      ts,
      configPath: "./vmc.config.mjs",
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain(".ts");
    }
  });

  it("returns error when configPath is a directory", () => {
    const dir = createTempDir();
    const configDir = join(dir, "vmc.config.ts");
    mkdirSync(configDir, { recursive: true });
    const result = loadVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("not-found");
    const explicit = loadVmcConfig({
      projectRoot: dir,
      ts,
      configPath: "./vmc.config.ts",
    });
    expect(explicit.status).toBe("error");
    if (explicit.status === "error") {
      expect(explicit.message).toContain("must point to a file");
    }
  });
});
