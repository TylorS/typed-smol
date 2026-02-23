import { dirname, join } from "node:path";
import type * as ts from "typescript";
import type { VirtualModuleDiagnostic } from "@typed/virtual-modules";
import { toPosixPath } from "./path.js";

const VIRTUAL_FILE_BASENAME = "__router_virtual_module.ts";

export interface TypeCheckRouterVirtualModuleParams {
  readonly ts: typeof import("typescript");
  readonly id: string;
  readonly importer: string;
  readonly emittedSource: string;
  readonly compilerOptions?: ts.CompilerOptions;
  readonly pluginName: string;
}

export type TypeCheckRouterVirtualModuleResult =
  | { readonly kind: "errors"; readonly errors: readonly VirtualModuleDiagnostic[] }
  | { readonly kind: "warnings"; readonly warnings: readonly VirtualModuleDiagnostic[] }
  | { readonly kind: "ok" };

const DIAGNOSTIC_CODE_PREFIX = "RVM-TC";

function toVirtualModuleDiagnostic(
  pluginName: string,
  diagnostic: ts.Diagnostic,
  tsMod: typeof import("typescript"),
): VirtualModuleDiagnostic {
  const message = tsMod.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  const code =
    typeof diagnostic.code === "number"
      ? `${DIAGNOSTIC_CODE_PREFIX}-${String(diagnostic.code).padStart(3, "0")}`
      : DIAGNOSTIC_CODE_PREFIX;
  return { code, message, pluginName };
}

/**
 * Type-checks the emitted router virtual module by creating a one-off Program that
 * includes the virtual file and the importer. Resolves the virtual id to the virtual
 * file path so the compiler loads our emitted source. Returns errors (blocking),
 * warnings (non-blocking), or ok.
 */
export function typeCheckRouterVirtualModule(
  params: TypeCheckRouterVirtualModuleParams,
): TypeCheckRouterVirtualModuleResult {
  const { ts: tsMod, id, importer, emittedSource, pluginName } = params;
  const importerDir = dirname(toPosixPath(importer));
  const virtualFilePath = toPosixPath(join(importerDir, VIRTUAL_FILE_BASENAME));

  const compilerOptions: ts.CompilerOptions = {
    strict: true,
    target: tsMod.ScriptTarget.ESNext,
    module: tsMod.ModuleKind.ESNext,
    moduleResolution: tsMod.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    ...params.compilerOptions,
  };

  const defaultHost = tsMod.createCompilerHost(compilerOptions);

  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile: (fileName: string, languageVersion: ts.ScriptTarget) => {
      if (toPosixPath(fileName) === virtualFilePath) {
        return tsMod.createSourceFile(
          fileName,
          emittedSource,
          languageVersion,
          true,
          tsMod.ScriptKind.TS,
        );
      }
      return defaultHost.getSourceFile(fileName, languageVersion);
    },
    resolveModuleNames: (
      moduleNames: string[],
      containingFile: string,
      _reusedNames: string[] | undefined,
      _redirectedReference: ts.ResolvedProjectReference | undefined,
      options: ts.CompilerOptions,
    ): (ts.ResolvedModule | undefined)[] => {
      return moduleNames.map((moduleName) => {
        if (moduleName === id && toPosixPath(containingFile) === toPosixPath(importer)) {
          return {
            resolvedFileName: virtualFilePath,
            extension: tsMod.Extension.Ts,
            isExternalLibraryImport: false,
          };
        }
        const resolved = tsMod.resolveModuleName(
          moduleName,
          containingFile,
          options,
          customHost as ts.ModuleResolutionHost,
        );
        return resolved.resolvedModule;
      });
    },
  };

  const program = tsMod.createProgram([importer], compilerOptions, customHost);
  const allDiagnostics = tsMod.getPreEmitDiagnostics(program);
  const virtualFileDiagnostics = allDiagnostics.filter(
    (d) => d.file && toPosixPath(d.file.fileName) === virtualFilePath,
  );

  if (virtualFileDiagnostics.length === 0) {
    return { kind: "ok" };
  }

  const errors = virtualFileDiagnostics.filter(
    (d) => d.category === tsMod.DiagnosticCategory.Error,
  );
  const warnings = virtualFileDiagnostics.filter(
    (d) => d.category === tsMod.DiagnosticCategory.Warning,
  );

  if (errors.length > 0) {
    return {
      kind: "errors",
      errors: errors.map((d) => toVirtualModuleDiagnostic(pluginName, d, tsMod)),
    };
  }

  if (warnings.length > 0) {
    return {
      kind: "warnings",
      warnings: warnings.map((d) => toVirtualModuleDiagnostic(pluginName, d, tsMod)),
    };
  }

  return { kind: "ok" };
}
