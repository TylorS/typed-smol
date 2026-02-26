/// <reference types="node" />
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";

const CLI_PATH = join(__dirname, "../../dist/bin.js");
const runTyped = (args: string[], cwd?: string) =>
  execSync(`node ${CLI_PATH} ${args.join(" ")}`, {
    encoding: "utf-8",
    cwd,
  });

describe("typed CLI integration", () => {
  it("prints help for root command", () => {
    const out = runTyped(["--help"]);
    expect(out).toContain("Typed-smol CLI");
    expect(out).toContain("serve");
    expect(out).toContain("build");
    expect(out).toContain("preview");
    expect(out).toContain("run");
  });

  it("prints help for serve subcommand", () => {
    const out = runTyped(["serve", "--help"]);
    expect(out).toContain("Start the development server");
    expect(out).toContain("--port");
    expect(out).toContain("--entry");
  });

  it("prints help for build subcommand", () => {
    const out = runTyped(["build", "--help"]);
    expect(out).toContain("Build for production");
    expect(out).toContain("--outDir");
  });

  it("prints help for preview subcommand", () => {
    const out = runTyped(["preview", "--help"]);
    expect(out).toContain("Preview production build");
  });

  it("prints help for run subcommand", () => {
    const out = runTyped(["run", "--help"]);
    expect(out).toContain("Run a TypeScript file");
  });

  it("fails when server entry is missing", () => {
    const noServerDir = join(__dirname, "../../");
    try {
      runTyped(["build"], noServerDir);
      expect.fail("Expected build to fail");
    } catch (e: unknown) {
      const err = e as { stdout?: Buffer; stderr?: Buffer; status?: number };
      const output = [err.stdout?.toString?.() ?? "", err.stderr?.toString?.() ?? ""].join("");
      expect(output).toMatch(/Server entry not found|No server entry/i);
    }
  });
});
