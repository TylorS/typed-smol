import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/dom-updates-and-reconciliation.md");

describe("template cost guide", () => {
  it("classifies lifecycle and reconciliation costs by template part family", () => {
    const guide = fs.readFileSync(guidePath, "utf8");

    expect(guide).toContain("## Cost table");
    expect(guide).toMatch(
      /\| Part family\s+\| Construction\s+\| Mount\s+\| Hydration\s+\| Update\s+\| n\s+\|/,
    );
    expect(guide).toMatch(/captured.*text.*attribute.*property.*boolean.*comment/is);
    expect(guide).toMatch(/class.*dataset.*spread/is);
    expect(guide).toMatch(/event handler/is);
    expect(guide).toMatch(/RenderEvent.*range/is);
    expect(guide).toMatch(/arrays?.*iterables?.*keyed/is);
    expect(guide).toMatch(/fast path.*fallback/is);
    expect(guide).toMatch(/already-parented.*moveBefore/is);
  });
});
