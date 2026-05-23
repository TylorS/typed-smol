import type { Plugin } from "vite";
import { toViteDiagnostic, type TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import { transformTemplateModule } from "./transformTemplateModule.js";

export type TypedTemplateViteDiagnosticMode = "error" | "warn" | "silent";

export interface TypedTemplateVitePluginOptions {
  readonly enabled?: boolean;
  readonly diagnostics?: TypedTemplateViteDiagnosticMode;
}

const PLUGIN_NAME = "typed-template";
const SCRIPT_MODULE_RE = /\.[cm]?[jt]sx?$/;
const DECLARATION_MODULE_RE = /\.d\.[cm]?ts$/;

interface ViteDiagnosticContext {
  warn(message: string): void;
  error(message: string): never;
}

export function typedTemplateVitePlugin(
  options: TypedTemplateVitePluginOptions = {},
): Plugin {
  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    transform(sourceText, id) {
      if (options.enabled === false) return null;
      const moduleId = moduleIdFromViteId(id);
      if (!shouldTransformModule(moduleId)) return null;
      const result = transformTemplateModule({ moduleId, sourceText });
      reportDiagnostics(this, result.diagnostics, options.diagnostics ?? "error");
      if (!result.transformed) return null;
      return { code: result.sourceText, map: null };
    },
  };
}

function moduleIdFromViteId(id: string): string {
  const queryStart = id.indexOf("?");
  return queryStart === -1 ? id : id.slice(0, queryStart);
}

function shouldTransformModule(moduleId: string): boolean {
  return SCRIPT_MODULE_RE.test(moduleId) && !DECLARATION_MODULE_RE.test(moduleId);
}

function reportDiagnostics(
  context: ViteDiagnosticContext,
  diagnostics: readonly TypedCompilerDiagnostic[],
  mode: TypedTemplateViteDiagnosticMode,
): void {
  if (mode === "silent") return;
  for (const diagnostic of diagnostics) {
    const viteDiagnostic = toViteDiagnostic(diagnostic, PLUGIN_NAME);
    if (mode === "warn") context.warn(viteDiagnostic.message);
    else context.error(viteDiagnostic.message);
  }
}
