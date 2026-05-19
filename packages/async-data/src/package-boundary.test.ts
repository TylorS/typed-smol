import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageRoot = resolve(import.meta.dirname, "..");
const readPackageFile = (path: string) => readFileSync(resolve(packageRoot, path), "utf8");

describe("@typed/async-data package boundary", () => {
  it("does not depend on RefSubject or export RefAsyncData bindings", () => {
    const packageJson = JSON.parse(readPackageFile("package.json")) as {
      readonly dependencies?: Record<string, string>;
    };
    const source = readPackageFile("src/index.ts");

    expect(packageJson.dependencies).not.toHaveProperty("@typed/fx");
    expect(source).not.toContain("@typed/fx");
    expect(source).not.toContain("RefSubject");
    expect(source).not.toContain("RefAsyncData");
  });
});
