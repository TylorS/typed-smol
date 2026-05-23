import { describe, expect, it } from "vitest";
import ts from "typescript";
import { createTypedCompilerExtension } from "./vmcExtension.js";

describe("createTypedCompilerExtension", () => {
  it("transforms imported typed html templates through direct DOM factories", () => {
    const extension = createTypedCompilerExtension();
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<p>${name}</p>`;",
    ].join("\n");
    const sourceFile = ts.createSourceFile("/project/view.ts", sourceText, ts.ScriptTarget.Latest);

    const result = extension.transformSource?.({
      fileName: "/project/view.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/view.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result?.diagnostics).toEqual([]);
    expect(result?.sourceText).toContain('from "@typed/template/compiler-runtime/dom"');
    expect(result?.sourceText).toContain("defineDomTemplate");
    expect(result?.sourceText).toContain("export const view = __typed_template_0(name);");
    expect(result?.sourceText).not.toContain("typedTemplatePlan");
    expect(result?.sourceText).not.toContain("html(__typed_template_0");
  });

  it("does not rewrite modules without typed template imports", () => {
    const extension = createTypedCompilerExtension();
    const sourceText = "export const view = String.raw`<p>static</p>`;";
    const sourceFile = ts.createSourceFile("/project/view.ts", sourceText, ts.ScriptTarget.Latest);

    const result = extension.transformSource?.({
      fileName: "/project/view.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/view.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result).toBeUndefined();
  });
});
