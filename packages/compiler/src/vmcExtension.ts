import type { VmcCompilerExtension } from "@typed/virtual-modules-compiler";
import { toTsDiagnostic } from "./diagnostics/diagnostics.js";
import { transformTemplateModule } from "./template/transformTemplateModule.js";

export function createTypedCompilerExtension(): VmcCompilerExtension {
  return {
    name: "@typed/compiler",
    transformSource: (input) => {
      const result = transformTemplateModule({
        moduleId: input.fileName,
        sourceText: input.sourceText,
        ts: input.ts,
      });
      if (!result.transformed && result.diagnostics.length === 0) return undefined;
      return {
        diagnostics: result.diagnostics.map((diagnostic) =>
          toTsDiagnostic(input.ts, diagnostic, input.sourceFile),
        ),
        sourceText: result.transformed ? result.sourceText : input.sourceText,
      };
    },
  };
}
