import { describe, expect, it } from "vitest";
import { analyzeTemplateModule } from "./analyzeTemplateModule.js";

describe("analyzeTemplateModule", () => {
  it("analyzes html named import aliases with source spans", () => {
    const sourceText = [
      'import { html as h } from "@typed/template";',
      'const name = "Ada";',
      "export const view = h`<p>Hello ${name}</p>`;",
    ].join("\n");

    const analysis = analyzeTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.templates).toHaveLength(1);
    expect(analysis.templates[0]).toMatchObject({
      localName: "view",
      tagName: "h",
    });
    expect(analysis.templates[0]?.quasis.map((quasi) => quasi.text)).toEqual([
      "<p>Hello ",
      "</p>",
    ]);
    expect(analysis.templates[0]?.expressions.map((expression) => expression.sourceText)).toEqual([
      "name",
    ]);
    expect(slice(sourceText, analysis.templates[0]?.templateSpan)).toBe('h`<p>Hello ${name}</p>`');
    expect(slice(sourceText, analysis.templates[0]?.expressions[0]?.span)).toBe("name");
    expect(analysis.templates[0]?.plan.parts).toEqual([
      { kind: "node", path: [0], valueIndex: 0 },
    ]);
  });

  it("analyzes namespace html imports", () => {
    const sourceText = [
      'import * as Template from "@typed/template";',
      "export const view = Template.html`<input />`;",
    ].join("\n");

    const analysis = analyzeTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.templates).toHaveLength(1);
    expect(analysis.templates[0]).toMatchObject({
      localName: "view",
      tagName: "Template.html",
    });
    expect(analysis.templates[0]?.plan.nodes).toEqual([
      {
        attributes: [],
        kind: "selfClosingElement",
        tagName: "input",
      },
    ]);
  });

  it("ignores local html identifiers that are not imported from @typed/template", () => {
    const sourceText = [
      "const html = String.raw;",
      "export const view = html`<p>not typed</p>`;",
    ].join("\n");

    const analysis = analyzeTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(analysis).toMatchObject({
      diagnostics: [],
      templates: [],
    });
  });
});

function slice(sourceText: string, span: { readonly start: number; readonly end: number } | undefined) {
  if (!span) return undefined;
  return sourceText.slice(span.start, span.end);
}
