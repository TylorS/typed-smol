/**
 * Integration tests that run against the sample-project fixture.
 * Validates vmc works with the documented setup. Note: tsc does not load LS plugins
 * (the ts-plugin is for editors/tsserver), so we only test vmc here.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeAll } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleProjectDir = join(__dirname, "..", "sample-project");
const vmcCliPath = join(__dirname, "..", "..", "virtual-modules-compiler", "dist", "cli.js");

describe("sample-project integration", () => {
  beforeAll(() => {
    const build = spawnSync("pnpm", ["run", "build:plugins"], {
      cwd: sampleProjectDir,
      encoding: "utf8",
      timeout: 15_000,
    });
    if (build.status !== 0) {
      throw new Error(`build:plugins failed: ${build.stderr || build.stdout}`);
    }
  });

  it("vmc --noEmit passes (mirrors tsc with virtual modules)", () => {
    const result = spawnSync("node", [vmcCliPath, "--noEmit"], {
      cwd: sampleProjectDir,
      encoding: "utf8",
      timeout: 10_000,
    });
    if (result.status !== 0) {
      const out = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      expect.fail(`vmc --noEmit failed (exit ${result.status}):\n${out || "(no output)"}`);
    }
    expect(result.stderr).toBe("");
  });
});
