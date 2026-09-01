import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideDirectory = path.join(websiteRoot, "content/guides");

const pages = [
  {
    slug: "render-your-first-template",
    section: "Templates",
    kind: "guide",
    requiredHeadings: ["Write and mount a static template", "Add one live value"],
  },
  {
    slug: "authoring-typed-templates",
    section: "Templates",
    kind: "concept",
    requiredHeadings: ["Author markup, interpolate values", "Choose the part you mean"],
  },
  {
    slug: "template-element-bindings",
    section: "Templates",
    kind: "deep-dive",
    requiredHeadings: [
      "Attributes serialize values",
      "Properties write live element state",
      "Boolean attributes use presence",
    ],
  },
  {
    slug: "renderable-normalization",
    section: "Templates",
    kind: "concept",
    requiredHeadings: ["The normalization matrix", "Errors and requirements compose"],
  },
  {
    slug: "template-spreads-data",
    section: "Templates",
    kind: "guide",
    requiredHeadings: ["`.data` owns a dataset slice", "Spread a record when the shape is dynamic"],
  },
  {
    slug: "template-text-only-contexts",
    section: "Templates",
    kind: "deep-dive",
    requiredHeadings: ["Choose the context deliberately", "Closing tags need neutralization"],
  },
  {
    slug: "keyed-template-collections",
    section: "Templates",
    kind: "guide",
    requiredHeadings: [
      "Render each item from its RefSubject",
      "DOM and SSR have different lifetimes",
    ],
  },
  {
    slug: "template-references-and-element-access",
    section: "Templates",
    kind: "guide",
    requiredHeadings: [
      "Capture an element without a component wrapper",
      "Let the rendering Scope own an external resource",
    ],
  },
  {
    slug: "template-namespaces-and-platform-markup",
    section: "Templates",
    kind: "deep-dive",
    requiredHeadings: [
      "Enter and leave foreign content in the markup",
      "Prefixed and case-sensitive attributes follow their element",
    ],
  },
  {
    slug: "native-events-with-effect",
    section: "Templates",
    kind: "guide",
    requiredHeadings: ["Make an event-aware Effect handler", "Native options stay native"],
  },
  {
    slug: "render-scheduling",
    section: "DOM and platform",
    kind: "deep-dive",
    requiredHeadings: [
      "A queue chooses when, not what",
      "Provide a queue at the rendering boundary",
    ],
  },
  {
    slug: "wire-and-rendered-dom-output",
    section: "DOM and platform",
    kind: "deep-dive",
    requiredHeadings: ["Pass a real DOM value", "Make a multi-node range persistent"],
  },
  {
    slug: "template-compilation-pipeline",
    section: "Integration",
    kind: "deep-dive",
    requiredHeadings: ["The public pipeline", "Emit the RenderEvent your target owns"],
  },
  {
    slug: "implementing-render-template",
    section: "Integration",
    kind: "deep-dive",
    requiredHeadings: [
      "Implement the public RenderTemplate contract",
      "Keep renderer-only machinery at the boundary",
    ],
  },
  {
    slug: "event-source-delegation",
    section: "Integration",
    kind: "deep-dive",
    requiredHeadings: [
      "Register a concrete target in a rendered range",
      "Keep browser listener semantics intact",
    ],
  },
] as const;

describe("public Template curriculum", () => {
  it("covers authoring, bindings, platform markup, events, output, and renderer targets", () => {
    const documents = pages.map(({ slug, section, kind, requiredHeadings }) => {
      const fileName = `${slug}.md`;
      const source = fs.readFileSync(path.join(guideDirectory, fileName), "utf8");
      const guide = parseGuideDocumentation(fileName, source);

      expect(guide.section).toBe(section);
      expect(guide.kind).toBe(kind);
      expect(guide.headings).toEqual(expect.arrayContaining([...requiredHeadings]));
      expect(extractTypeScriptFences(guide.body).length).toBeGreaterThan(0);
      return guide;
    });

    expect(validateAuthoredExampleQuality(documents)).toEqual([]);
  });

  it("keeps the first template path short and links its deeper follow-ups", () => {
    const source = fs.readFileSync(path.join(guideDirectory, "render-your-first-template.md"), "utf8");

    expect(source.trim().split(/\s+/u).length).toBeLessThanOrEqual(1000);
    expect(source).toContain("/explore/template-element-bindings");
    expect(source).toContain("/explore/template-spreads-data");
    expect(source).toContain("/explore/template-references-and-element-access");
    expect(source).toContain("/explore/native-events-with-effect");
    expect(source).toContain("/explore/renderable-normalization");
    expect(source).toContain("/explore/render-scheduling");
  });
});
