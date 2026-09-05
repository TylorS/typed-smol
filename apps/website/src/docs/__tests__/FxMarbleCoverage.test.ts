import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractFxMarbleOperators, validateFxMarbleCoverage } from "../FxMarbleCoverage.js";
import { renderMarkdown } from "../../site/Markdown.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("Fx marble coverage", () => {
  it("reads explicit public operator coverage from marble fences", () => {
    expect(
      extractFxMarbleOperators(`Before.

\`\`\`fx-marble
title: map and mapEffect preserve timing
covers: map, mapEffect
input: 1 . 2 |
operator: map / mapEffect
output: a . b |
\`\`\`

After.`),
    ).toEqual(["map", "mapEffect"]);
  });

  it("reports missing, duplicate, and non-public operator names", () => {
    const report = validateFxMarbleCoverage(["map", "filter"], [
      {
        slug: "transforming",
        body: `\`\`\`fx-marble
covers: map, internalMap
input: 1 |
operator: map
output: 2 |
\`\`\``,
      },
      {
        slug: "more-transforming",
        body: `\`\`\`fx-marble
covers: map
input: 2 |
operator: map
output: 3 |
\`\`\``,
      },
    ]);

    expect(report.missing).toEqual(["filter"]);
    expect(report.duplicates).toEqual(["map"]);
    expect(report.unexpected).toEqual(["internalMap"]);
  });

  it("covers every public @typed/fx/Fx combinator exactly once", async () => {
    const inventory = JSON.parse(
      fs.readFileSync(path.join(websiteRoot, "src/generated/reference.json"), "utf8"),
    ) as {
      readonly modules: ReadonlyArray<{
        readonly consumerSpecifier: string;
        readonly categories: ReadonlyArray<{
          readonly name: string;
          readonly exposureIds: ReadonlyArray<string>;
        }>;
      }>;
    };
    const publicOperators = inventory.modules
      .find(({ consumerSpecifier }) => consumerSpecifier === "@typed/fx/Fx")!
      .categories.find(({ name }) => name === "combinators")!
      .exposureIds.map((id) => id.slice(id.indexOf("#") + 1));
    const guides = fs
      .readdirSync(path.join(websiteRoot, "content/guides"))
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) =>
        parseGuideDocumentation(
          fileName,
          fs.readFileSync(path.join(websiteRoot, "content/guides", fileName), "utf8"),
        ),
      );
    const report = validateFxMarbleCoverage(publicOperators, guides);

    expect(publicOperators).toHaveLength(117);
    expect(report).toMatchObject({ duplicates: [], missing: [], unexpected: [] });
    expect(report.appearances).toHaveLength(publicOperators.length);

    const rendered = await Promise.all(guides.map(({ body }) => renderMarkdown(body)));
    const renderedOperators = rendered.flatMap(({ code }) =>
      [...code.matchAll(/data-fx-operators="([^"]+)"/gu)].flatMap(
        ([, names]) => names!.split(" "),
      ),
    );
    expect(renderedOperators.toSorted()).toEqual(publicOperators.toSorted());
  });
});
