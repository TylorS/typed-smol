import { describe, expect, it } from "vitest";
import ts from "typescript";
import { getTemplateDiagnostics } from "./templateDiagnostics.js";

describe("getTemplateDiagnostics", () => {
  it("returns TypeScript diagnostics for invalid typed templates", () => {
    const sourceText = 'import { html } from "@typed/template";\nhtml`<div .props=>`;';
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
    expect(String(diagnostics[0]?.messageText)).toContain("TYPED-TEMPLATE-ANALYZE-001");
  });
});
