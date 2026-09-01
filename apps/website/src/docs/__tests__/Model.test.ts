import { describe, expect, it } from "vitest";
import { validateDocumentation } from "../Policy.js";
import { renderGuideMarkdown, renderSymbolMarkdown } from "../RenderMarkdown.js";
import { documentationSchema } from "../Schema.js";
import { buildSearchIndex, searchDocumentation } from "../Search.js";
import type { SearchEntry } from "../Search.js";
import type { DocumentationModel, SymbolDocumentation } from "../Model.js";

const symbol: SymbolDocumentation = {
  id: "@typed/template/RenderEvent#DomRenderEvent",
  packageName: "@typed/template",
  moduleName: "RenderEvent",
  exportName: "DomRenderEvent",
  kind: "function",
  signatures: ["DomRenderEvent(value: Rendered): RenderEvent"],
  summary:
    "Wraps already-rendered DOM values as renderer output without taking ownership of surrounding DOM.",
  sections: {
    Why: "Lets any renderer participate through the platform DOM boundary.",
    "Ownership and lifetime": "The producing Fx and Scope own subscriptions and teardown.",
  },
  examples: [
    { language: "ts", code: 'import { DomRenderEvent } from "@typed/template/RenderEvent"' },
  ],
  relations: [{ kind: "glossary", target: "render-event" }],
  source: { file: "packages/template/src/RenderEvent.ts", line: 42 },
  since: "0.70.0",
  category: "rendering",
};

const model: DocumentationModel = {
  schemaVersion: 1,
  repositoryRevision: "test-revision",
  packages: [],
  guides: [
    {
      slug: "render-event-substrate",
      title: "Render events are the substrate",
      summary: "Integrate arbitrary renderers without surrendering ownership.",
      headings: ["DOM output", "HTML output"],
      body: "A RenderEvent carries renderer output.",
      relations: [{ kind: "symbol", target: symbol.id }],
    },
  ],
  glossary: [
    {
      id: "render-event",
      term: "RenderEvent",
      aliases: ["render event"],
      definition: "A value describing renderer output.",
      details: "The common output protocol consumed by Typed rendering.",
      related: ["fx"],
      links: [symbol.id],
    },
  ],
  symbols: [symbol],
};

describe("documentation model", () => {
  it("validates required prose, public imports, and relation targets", () => {
    expect(validateDocumentation(model)).toEqual([]);
    expect(
      validateDocumentation({
        ...model,
        symbols: [
          { ...symbol, sections: {}, examples: [{ language: "ts", code: "DomRenderEvent(node)" }] },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Why"),
        expect.stringContaining("Ownership and lifetime"),
        expect.stringContaining("exact public import"),
      ]),
    );
  });

  it("ranks exact, prefix, and prose matches deterministically", () => {
    const index = buildSearchIndex(model);
    expect(searchDocumentation(index, "DomRenderEvent")[0]?.id).toBe(symbol.id);
    expect(searchDocumentation(index, "renderer output").map((result) => result.id)).toEqual([
      "glossary:render-event",
      symbol.id,
      "guide:render-event-substrate",
    ]);
  });

  it("recovers useful results from misspelled identifiers and phrases", () => {
    const index = buildSearchIndex(model);

    expect(searchDocumentation(index, "DomRenderEvnt")[0]?.id).toBe(symbol.id);
    expect(searchDocumentation(index, "render evnt substrte")[0]?.id).toBe(
      "guide:render-event-substrate",
    );
    expect(searchDocumentation(index, "completely unrelated query")).toEqual([]);
  });

  it("collapses fuzzy aliases to canonical declarations but preserves exact exposure paths", () => {
    const aliases: ReadonlyArray<SearchEntry> = [
      {
        id: "@typed/fx#share",
        canonicalId: "@typed/fx#share",
        declarationKey: "share-function",
        title: "share",
        kind: "exposure",
        href: "/reference/root-share",
        text: "share multicast",
        specifier: "@typed/fx",
      },
      {
        id: "@typed/fx/Subject#share",
        canonicalId: "@typed/fx#share",
        declarationKey: "share-function",
        title: "share",
        kind: "exposure",
        href: "/reference/subject-share",
        text: "share multicast @typed/fx/Subject",
        specifier: "@typed/fx/Subject",
      },
      {
        id: "@typed/fx#Share",
        canonicalId: "@typed/fx#Share",
        declarationKey: "share-class",
        title: "Share",
        kind: "exposure",
        href: "/reference/share-class",
        text: "Share subject model",
        specifier: "@typed/fx",
      },
    ];

    expect(searchDocumentation(aliases, "share", 10).map(({ id }) => id)).toEqual([
      "@typed/fx#share",
      "@typed/fx#Share",
    ]);
    expect(searchDocumentation(aliases, "@typed/fx/Subject#share", 10)[0]?.id).toBe(
      "@typed/fx/Subject#share",
    );
    expect(searchDocumentation(aliases, "@typed/fx/Subject", 10).map(({ id }) => id)).toContain(
      "@typed/fx/Subject#share",
    );
  });

  it("renders self-contained Markdown and exposes schema version 1", () => {
    const markdown = renderSymbolMarkdown(symbol);
    expect(markdown).toContain("# DomRenderEvent");
    expect(markdown).toContain("## Why");
    expect(markdown).toContain("```ts");
    expect(documentationSchema).toMatchObject({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      properties: { schemaVersion: { enum: [1] } },
    });
  });

  it("renders authored guide Markdown with semantic anchors and code blocks", () => {
    const rendered = renderGuideMarkdown(`
## Ownership and lifetime

The producing **Scope** owns cleanup.

\`\`\`ts
const output = DomRenderEvent(node)
\`\`\`
`);

    expect(rendered.html).toContain('<h2 id="ownership-and-lifetime">');
    expect(rendered.html).toContain("<strong>Scope</strong>");
    expect(rendered.html).toContain('<code class="language-ts">');
    expect(rendered.last).toBe(true);
  });
});
