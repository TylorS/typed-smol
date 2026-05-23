import { describe, expect, it } from "vitest";
import ts from "typescript";
import { createTypedCompilerExtension } from "./vmcExtension.js";
import { invalidRouteDiagnosticCode, invalidRouteModuleSource } from "./route/routeFixtures.js";

describe("createTypedCompilerExtension", () => {
  it("transforms imported typed html templates through module transform metadata", () => {
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
    expect(result?.sourceText).toContain("typedTemplatePlan");
    expect(result?.sourceText).toContain("export const view = html(__typed_template_0, name);");
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

  it("reports route resumability diagnostics through the compiler extension", () => {
    const extension = createTypedCompilerExtension();
    const sourceFile = ts.createSourceFile(
      "/project/routes/mutable.ts",
      invalidRouteModuleSource,
      ts.ScriptTarget.Latest,
    );

    const result = extension.transformSource?.({
      fileName: "/project/routes/mutable.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/routes/mutable.ts"],
      sourceFile,
      sourceText: invalidRouteModuleSource,
      ts,
    });

    expect(result?.sourceText).toBe(invalidRouteModuleSource);
    expect(
      result?.diagnostics?.some((diagnostic) =>
        String(diagnostic.messageText).includes(invalidRouteDiagnosticCode),
      ),
    ).toBe(true);
  });
});
