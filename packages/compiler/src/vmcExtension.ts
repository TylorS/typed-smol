import type { VmcCompilerExtension } from "@typed/virtual-modules-compiler";
import { toTsDiagnostic } from "./diagnostics/diagnostics.js";
import { createRouteModuleMatcher, type RouteModuleMatcher } from "./route/routeModuleMatcher.js";
import { transformRouteModule } from "./route/transformRouteModule.js";
import { transformTemplateModule } from "./template/transformTemplateModule.js";

export interface TypedCompilerExtensionOptions {
  readonly projectRoot?: string;
  readonly routeDirectories?: readonly string[];
  readonly routeModuleMatcher?: RouteModuleMatcher;
}

export function createTypedCompilerExtension(
  options: TypedCompilerExtensionOptions = {},
): VmcCompilerExtension {
  return {
    name: "@typed/compiler",
    transformSource: (input) => {
      const routeModuleMatcher =
        options.routeModuleMatcher ??
        createRouteModuleMatcher({
          projectRoot: options.projectRoot ?? input.projectRoot,
          routeDirectories: options.routeDirectories,
        });
      const template = transformTemplateModule({
        moduleId: input.fileName,
        projectRoot: options.projectRoot ?? input.projectRoot,
        routeDirectories: options.routeDirectories,
        routeModuleMatcher,
        sourceText: input.sourceText,
        ts: input.ts,
      });
      const route = routeModuleMatcher(input.fileName)
        ? transformRouteModule({
            moduleId: input.fileName,
            sourceFile: template.transformed
              ? input.ts.createSourceFile(input.fileName, template.sourceText, input.ts.ScriptTarget.Latest, true)
              : input.sourceFile,
            sourceText: template.sourceText,
            ts: input.ts,
          })
        : null;
      const diagnostics = [...template.diagnostics, ...(route?.diagnostics ?? [])];
      if (!template.transformed && route?.transformed !== true && diagnostics.length === 0) {
        return undefined;
      }
      return {
        diagnostics: diagnostics.map((diagnostic) =>
          toTsDiagnostic(input.ts, diagnostic, input.sourceFile),
        ),
        sourceText: route?.sourceText ?? template.sourceText,
      };
    },
  };
}
