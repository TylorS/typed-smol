import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fileName = "template-element-bindings.md";
const guidePath = path.join(websiteRoot, "content/guides", fileName);

describe("Template element bindings guide", () => {
  it("documents exact attribute, property, and boolean contracts", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(fileName, source);

    expect(guide).toMatchObject({
      section: "Templates",
      kind: "deep-dive",
      order: 3.15,
    });
    expect(guide.headings).toEqual(
      expect.arrayContaining([
        "Attributes serialize values",
        "Properties write live element state",
        "Boolean attributes use presence",
      ]),
    );
    expect(source).toContain("?disabled=${disabled}");
    expect(source).toMatch(/null.*undefined.*remove the attribute/su);
    expect(source).toContain("O(1) with respect to the surrounding tree");
    expect(extractTypeScriptFences(guide.body)).toHaveLength(3);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);
  });
});
