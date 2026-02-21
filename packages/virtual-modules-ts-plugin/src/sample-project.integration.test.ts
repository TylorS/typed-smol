/**
 * Integration tests that run against the sample-project fixture.
 * Validates vmc works with the documented setup. Note: tsc does not load LS plugins
 * (the ts-plugin is for editors/tsserver), so we only test vmc here.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleProjectDir = join(__dirname, "..", "sample-project");
const vmcCliPath = join(__dirname, "..", "..", "virtual-modules-compiler", "dist", "cli.js");

describe("sample-project integration", () => {
  it("vmc --noEmit passes (mirrors tsc with virtual modules)", () => {
    const result = spawnSync("node", [vmcCliPath, "--noEmit"], {
      cwd: sampleProjectDir,
      encoding: "utf8",
      timeout: 10_000,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});
