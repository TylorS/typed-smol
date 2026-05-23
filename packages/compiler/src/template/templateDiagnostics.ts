import ts from "typescript";
import { toTsDiagnostic } from "../diagnostics/diagnostics.js";
import { analyzeTemplateModule } from "./analyzeTemplateModule.js";

export interface GetTemplateDiagnosticsInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly sourceFile?: ts.SourceFile;
  readonly ts?: typeof ts;
}

export function getTemplateDiagnostics(
  input: GetTemplateDiagnosticsInput,
): readonly ts.Diagnostic[] {
  const tsMod = input.ts ?? ts;
  const sourceFile =
    input.sourceFile ??
    tsMod.createSourceFile(input.moduleId, input.sourceText, tsMod.ScriptTarget.Latest, true);
  const analysis = analyzeTemplateModule({
    moduleId: input.moduleId,
    sourceText: input.sourceText,
    ts: tsMod,
  });
  return analysis.diagnostics.map((diagnostic) =>
    toTsDiagnostic(tsMod, diagnostic, sourceFile),
  );
}
