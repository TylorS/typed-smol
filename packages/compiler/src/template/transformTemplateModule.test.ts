import { describe, expect, it } from "vitest";
import { transformTemplateModule } from "./transformTemplateModule.js";

describe("transformTemplateModule", () => {
  it("emits direct DOM template factories by default", () => {
    const sourceText = [
      'import { html as h } from "@typed/template";',
      'const name = "Ada";',
      "export const view = h`<p>Hello ${name}</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain('from "@typed/template/compiler-runtime/dom"');
    expect(result.sourceText).toContain("defineDomTemplate");
    expect(result.sourceText).toContain("templateHash");
    expect(result.sourceText).toContain("export const view = __typed_template_0(name);");
    expect(result.sourceText).not.toContain("typedTemplatePlan");
    expect(result.sourceText).not.toContain("Object.assign");
    expect(result.sourceText).not.toContain("h(__typed_template_0");
    expect(result.sourceText).not.toContain("h`<p>Hello");
  });

  it("does not inject duplicate imports when a module already imports Effect", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      'import * as Effect from "effect/Effect";',
      "const name = Effect.succeed('Ada');",
      "export const view = html`<p>Hello ${name}</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText.match(/from "effect\/Effect"/g)).toHaveLength(1);
    expect(result.sourceText).toContain('import * as Effect from "effect/Effect";');
    expect(result.sourceText).toContain("Effect.succeed('Ada')");
  });

  it("rewrites namespace html imports to direct factories", () => {
    const sourceText = [
      'import * as Template from "@typed/template";',
      "const label = 'Save';",
      "export const view = Template.html`<button>${label}</button>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain("export const view = __typed_template_0(label)");
    expect(result.sourceText).not.toContain("Template.html(__typed_template_0");
  });

  it("does not corrupt nested html templates inside outer template expressions", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const avatar = '/avatar.png';",
      "const Link = (options: unknown) => options;",
      "export const view = html`${Link({ content: html`<img src=${avatar} />` })}`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain(
      "export const view = __typed_template_0(Link({ content: html`<img src=${avatar} />` }));",
    );
    expect(result.sourceText).not.toContain("html(__typed_template_0");
    expect(result.sourceText).not.toContain(")iv>");
  });

  it("does not direct-transform function-local renderable templates", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export function view(name: string) {",
      "  return html`<p>Hello ${name}</p>`;",
      "}",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
  });

  it("does not direct-transform route module template exports", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const template = html`<section>Login</section>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/routes/login.ts",
      sourceText,
      target: "server",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
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

  it("can emit direct server template factories instead of html calls", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<main>Hello ${name}</main>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/view.ts",
      sourceText,
      target: "server",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain(
      'from "@typed/template/compiler-runtime/server"',
    );
    expect(result.sourceText).toContain("defineServerTemplate");
    expect(result.sourceText).toContain("renderServerChunks");
    expect(result.sourceText).toContain("export const view = __typed_template_0(name);");
    expect(result.sourceText).not.toContain("html(__typed_template_0");
    expect(result.sourceText).not.toContain("html`<main>");
  });

  it("can emit direct DOM template factories with path-bound parts", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<main>Hello ${name}</main>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/view.ts",
      sourceText,
      target: "dom",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain('from "@typed/template/compiler-runtime/dom"');
    expect(result.sourceText).toContain("defineDomTemplate");
    expect(result.sourceText).toContain("bindNode");
    expect(result.sourceText).toContain("getCommentAtPath");
    expect(result.sourceText).toContain("export const view = __typed_template_0(name);");
    expect(result.sourceText).not.toContain("html(__typed_template_0");
    expect(result.sourceText).not.toContain("html`<main>");
  });

  it("leaves unsupported direct templates unchanged instead of metadata fallback", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const props = { id: 'save' };",
      "export const view = html`<button ...${props}>Save</button>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
    expect(result.sourceText).not.toContain("typedTemplatePlan");
    expect(result.sourceText).not.toContain("Object.assign");
  });
});
