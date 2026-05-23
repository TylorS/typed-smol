import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageRoot = resolve(import.meta.dirname, "..");
const readPackageJson = () =>
  JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")) as {
    readonly exports: Record<string, unknown>;
    readonly files?: readonly string[];
    readonly scripts: { readonly build?: string };
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

  it("keeps package-local fixtures out of declaration and publish output", () => {
    const tsconfig = JSON.parse(readFileSync(resolve(packageRoot, "tsconfig.json"), "utf8")) as {
      readonly exclude?: readonly string[];
    };
    const packageJson = readPackageJson();

    expect(tsconfig.exclude ?? []).toContain("src/fixtures/**");
    expect(packageJson.files ?? []).toEqual(["dist", "src"]);
    expect(packageJson.files ?? []).not.toContain("fixtures");
    expect(existsSync(resolve(packageRoot, "fixtures/public-beta/.storybook/main.ts"))).toBe(true);
  });

  it("cleans declaration output before building", () => {
    const packageJson = readPackageJson();

    expect(packageJson.scripts.build ?? "").toContain("rm -rf dist");
  });
});
