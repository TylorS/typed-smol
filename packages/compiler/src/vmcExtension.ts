import type { VmcCompilerExtension } from "@typed/virtual-modules-compiler";
import { toTsDiagnostic } from "./diagnostics/diagnostics.js";
import { transformTemplateModule } from "./template/transformTemplateModule.js";
import { transformRouteModule } from "./route/transformRouteModule.js";

export function createTypedCompilerExtension(): VmcCompilerExtension {
  return {
    name: "@typed/compiler",
    transformSource: (input) => {
      const template = transformTemplateModule({
        moduleId: input.fileName,
        sourceText: input.sourceText,
        ts: input.ts,
      });
      const route = transformRouteModule({
        moduleId: input.fileName,
        sourceText: template.sourceText,
        ts: input.ts,
      });
      const diagnostics = [...template.diagnostics, ...route.diagnostics];
      if (!template.transformed && !route.transformed && diagnostics.length === 0) return undefined;
      return {
        diagnostics: diagnostics.map((diagnostic) =>
          toTsDiagnostic(input.ts, diagnostic, input.sourceFile),
        ),
        sourceText: route.transformed ? route.sourceText : template.sourceText,
      };
    },
  };
}
