import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

describe("RealWorld DevTools smoke mode", () => {
  it("keeps the browser entrypoint on the default production virtual module", () => {
    const source = readFileSync(resolve(root, "src/browser.ts"), "utf8");

    expect(source).toContain("typed:browser?routes=./routes");
    expect(source).not.toContain("typed:browser?routes=./routes&devtools=1");
    expect(source).not.toContain("devtools:");
  });
});
