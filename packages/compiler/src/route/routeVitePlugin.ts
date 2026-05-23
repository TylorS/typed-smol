import type { ModuleNode, Plugin } from "vite";
import { toViteDiagnostic, type TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import { transformRouteModule } from "./transformRouteModule.js";

export type TypedRouteViteDiagnosticMode = "error" | "warn" | "silent";

export interface TypedRouteVitePluginOptions {
  readonly enabled?: boolean;
  readonly diagnostics?: TypedRouteViteDiagnosticMode;
  readonly hmr?: boolean;
}

const PLUGIN_NAME = "typed-route";
const SCRIPT_MODULE_RE = /\.[cm]?[jt]sx?$/;
const DECLARATION_MODULE_RE = /\.d\.[cm]?ts$/;

interface ViteDiagnosticContext {
  warn(message: string): void;
  error(message: string): never;
}

export function typedRouteVitePlugin(options: TypedRouteVitePluginOptions = {}): Plugin {
  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    async handleHotUpdate(context) {
      if (options.enabled === false) return context.modules;
      if (!shouldTransformModule(context.file)) return context.modules;
      const sourceText = await context.read();
      const result = transformRouteModule({ moduleId: context.file, sourceText });
      if (!hasErrorDiagnostics(result.diagnostics)) return context.modules;
      const invalidatedModules = new Set<ModuleNode>();
      for (const mod of context.modules) {
        context.server.moduleGraph.invalidateModule(mod, invalidatedModules, context.timestamp, true);
      }
      context.server.ws.send({ type: "full-reload" });
      return [];
    },
    transform(sourceText, id) {
      if (options.enabled === false) return null;
      const moduleId = moduleIdFromViteId(id);
      if (!shouldTransformModule(moduleId)) return null;
      const result = transformRouteModule({ moduleId, sourceText });
      reportDiagnostics(this, result.diagnostics, options.diagnostics ?? "error");
      if (!result.transformed) return null;
      return {
        code: withHmrRuntime(result.sourceText, options.hmr !== false),
        map: null,
      };
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

function withHmrRuntime(sourceText: string, hmr: boolean): string {
  if (!hmr) return sourceText;
  return `${sourceText}\n${routeHmrRuntime()}`;
}

function routeHmrRuntime(): string {
  return [
    "type __TypedRouteHot = {",
    "  readonly data: Record<string, unknown>;",
    "  readonly accept: () => void;",
    "  readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;",
    "  readonly invalidate: (message?: string) => void;",
    "};",
    "const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;",
    "if (__typedRouteHot) {",
    "  __typedRouteHot.accept();",
    "  __typedRouteHot.dispose((data) => {",
    "    data.__typedRouteContinuations = __typedRouteContinuations;",
    '    if (typeof __typedRouteContinuationSerializables !== "undefined") {',
    "      data.__typedRouteContinuationSerializables = __typedRouteContinuationSerializables;",
    "    }",
    "  });",
    "}",
  ].join("\n");
}

function reportDiagnostics(
  context: ViteDiagnosticContext,
  diagnostics: readonly TypedCompilerDiagnostic[],
  mode: TypedRouteViteDiagnosticMode,
): void {
  if (mode === "silent") return;
  for (const diagnostic of diagnostics) {
    const viteDiagnostic = toViteDiagnostic(diagnostic, PLUGIN_NAME);
    if (mode === "warn") context.warn(viteDiagnostic.message);
    else context.error(viteDiagnostic.message);
  }
}

function hasErrorDiagnostics(diagnostics: readonly TypedCompilerDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
