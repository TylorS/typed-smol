import { describe, expect, it } from "vitest";
import ts from "typescript";
import { getTemplateDiagnostics } from "./templateDiagnostics.js";
import { invalidTemplateModuleSource } from "./templateFixtures.js";

describe("getTemplateDiagnostics", () => {
  it("returns TypeScript diagnostics for invalid typed templates", () => {
    const sourceText = invalidTemplateModuleSource;
    const sourceFile = ts.createSourceFile("/src/view.ts", sourceText, ts.ScriptTarget.Latest);

    const diagnostics = getTemplateDiagnostics({
      moduleId: "/src/view.ts",
      sourceFile,
      sourceText,
      ts,
    });

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      category: ts.DiagnosticCategory.Error,
      code: 900001,
      file: sourceFile,
    });
    expect(String(diagnostics[0]?.messageText)).toMatchInlineSnapshot(`"TYPED-TEMPLATE-ANALYZE-001: Expected AttrValueDq or AttrValueSq or AttrValueNq but got OpenTagEnd"`);
  });
});
