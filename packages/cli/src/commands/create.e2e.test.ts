/// <reference types="node" />
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const CLI_PATH = join(__dirname, "../../dist/bin.js");
const tempDirs: string[] = [];

function tempRoot() {
  const root = mkdtempSync(join(process.cwd(), "tmp-typed-create-e2e-"));
  tempDirs.push(root);
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("typed create e2e", () => {
  it("scaffolds a standalone starter workspace through the built CLI", () => {
    const root = tempRoot();
    const output = execSync(`node ${CLI_PATH} create demo-app`, {
      cwd: root,
      encoding: "utf8",
    });
    const target = join(root, "demo-app");

    expect(output).toContain("Created Typed workspace");
    expect(existsSync(join(target, "pnpm-workspace.yaml"))).toBe(true);
    expect(existsSync(join(target, "packages/app/src/entry.server.ts"))).toBe(true);
    expect(existsSync(join(target, "packages/app/src/entry.browser.ts"))).toBe(true);
    expect(readFileSync(join(target, "package.json"), "utf8")).toContain(
      '"@typed/cli": "^1.0.0-beta.4"',
    );
  });
});
