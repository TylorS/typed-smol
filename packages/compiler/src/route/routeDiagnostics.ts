import ts from "typescript";
import { createCompilerDiagnostic, toTsDiagnostic } from "../diagnostics/diagnostics.js";
import { analyzeRouteModule } from "./analyzeRouteModule.js";

export interface GetRouteDiagnosticsInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly sourceFile?: ts.SourceFile;
  readonly ts?: typeof ts;
}

export function getRouteDiagnostics(input: GetRouteDiagnosticsInput): readonly ts.Diagnostic[] {
  const tsMod = input.ts ?? ts;
  const sourceFile =
    input.sourceFile ??
    tsMod.createSourceFile(input.moduleId, input.sourceText, tsMod.ScriptTarget.Latest, true);
  const route = analyzeRouteModule({ moduleId: input.moduleId, sourceText: input.sourceText });
  return route.diagnostics.map((diagnostic) =>
    toTsDiagnostic(
      tsMod,
      createCompilerDiagnostic({
        code: diagnostic.code,
        fileName: input.moduleId,
        message: diagnostic.message,
        severity: "error",
        source: "compiler",
      }),
      sourceFile,
    ),
  );
}
