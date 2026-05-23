import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageRoot = resolve(import.meta.dirname, "..");
const readPackageJson = () =>
  JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")) as {
    readonly exports: Record<string, unknown>;
  };

describe("@typed/storybook package boundary", () => {
  it("declares the Storybook framework entrypoints backed by source files", () => {
    const packageJson = readPackageJson();

    expect(Object.keys(packageJson.exports).sort()).toEqual([
      ".",
      "./package.json",
      "./preset",
      "./preview.js",
      "./testing",
    ]);

    expect(existsSync(resolve(packageRoot, "src/index.ts"))).toBe(true);
    expect(existsSync(resolve(packageRoot, "src/preset.ts"))).toBe(true);
    expect(existsSync(resolve(packageRoot, "src/preview.ts"))).toBe(true);
    expect(existsSync(resolve(packageRoot, "src/testing.ts"))).toBe(true);
    expect(existsSync(resolve(packageRoot, "src/types.ts"))).toBe(true);
  });
});
