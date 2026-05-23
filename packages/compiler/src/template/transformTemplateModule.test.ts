import { describe, expect, it } from "vitest";
import { transformTemplateModule } from "./transformTemplateModule.js";

describe("transformTemplateModule", () => {
  it("hoists analyzed template plans and rewrites imported html tags to calls", () => {
    const sourceText = [
      'import { html as h } from "@typed/template";',
      'const name = "Ada";',
      "export const view = h`<p>Hello ${name}</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain("const __typed_template_0 = Object.assign");
    expect(result.sourceText).toContain("typedTemplatePlan");
    expect(result.sourceText).toContain("templateHash");
    expect(result.sourceText).toContain("export const view = h(__typed_template_0, name);");
    expect(result.sourceText).not.toContain("h`<p>Hello");
  });

  it("rewrites namespace html imports with their original tag expression", () => {
    const sourceText = [
      'import * as Template from "@typed/template";',
      "const label = 'Save';",
      "export const view = Template.html`<button>${label}</button>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain("Template.html(__typed_template_0, label)");
  });

  it("preserves modules without imported typed templates", () => {
    const sourceText = [
      "const html = String.raw;",
      "export const view = html`<p>not typed</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result).toMatchObject({
      diagnostics: [],
      sourceText,
      transformed: false,
    });
  });
});
