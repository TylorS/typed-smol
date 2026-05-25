import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

describe("RealWorld DevTools smoke mode", () => {
  it("keeps devtools opt-in at the browser entrypoint", () => {
    const source = readFileSync(resolve(root, "src/browser.ts"), "utf8");

    expect(source).toContain('VITE_TYPED_DEVTOOLS_SMOKE === "1"');
    expect(source).toContain("run({ devtools:");
  });
});
