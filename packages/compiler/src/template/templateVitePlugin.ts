import ts from "typescript";
import type { Plugin } from "vite";
import { toViteDiagnostic, type TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import { analyzeRouteDependencyGraph } from "../route/analyzeRouteDependencyGraph.js";
import { transformRouteModule } from "../route/transformRouteModule.js";
import {
  createRouteModuleMatcher,
  type RouteModuleMatcher,
} from "../route/routeModuleMatcher.js";
import { transformTemplateModule } from "./transformTemplateModule.js";

export type TypedTemplateViteDiagnosticMode = "error" | "warn" | "silent";
export type TypedTemplateProgramProvider = () => ts.Program | undefined;

export interface TypedTemplateVitePluginOptions {
  readonly enabled?: boolean;
  readonly diagnostics?: TypedTemplateViteDiagnosticMode;
  readonly programProvider?: TypedTemplateProgramProvider;
  readonly projectRoot?: string;
  readonly routeDirectories?: readonly string[];
  readonly routeModuleMatcher?: RouteModuleMatcher;
}

const PLUGIN_NAME = "typed-template";
const SCRIPT_MODULE_RE = /\.[cm]?[jt]sx?$/;
const DECLARATION_MODULE_RE = /\.d\.[cm]?ts$/;

interface ViteDiagnosticContext {
  warn(message: string): void;
  error(message: string): never;
}

interface RouteCompilerFacts {
  readonly checker?: ts.TypeChecker;
  readonly dependencyFingerprints?: readonly string[];
  readonly sourceFile?: ts.SourceFile;
}

export function typedTemplateVitePlugin(
  options: TypedTemplateVitePluginOptions = {},
): Plugin {
  const routeModuleMatcher =
    options.routeModuleMatcher ??
    createRouteModuleMatcher({
      projectRoot: options.projectRoot,
      routeDirectories: options.routeDirectories,
    });

  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    transform(sourceText, id, transformOptions) {
      if (options.enabled === false) return null;
      const moduleId = moduleIdFromViteId(id);
      if (!shouldTransformModule(moduleId)) return null;
      const target = transformOptions?.ssr ? "server" : "dom";
      const template = transformTemplateModule({
        moduleId,
        projectRoot: options.projectRoot,
        routeDirectories: options.routeDirectories,
        routeModuleMatcher,
        sourceText,
        target,
      });
      const route = routeModuleMatcher(moduleId)
        ? transformRouteModule({
            ...routeCompilerFacts(options.programProvider?.(), moduleId),
            moduleId,
            sourceText: template.sourceText,
          })
        : null;
      const diagnostics = [...template.diagnostics, ...(route?.diagnostics ?? [])];
      reportDiagnostics(this, diagnostics, options.diagnostics ?? "error");
      if (!template.transformed && route?.transformed !== true) return null;
      return { code: route?.sourceText ?? template.sourceText, map: null };
    },
    handleHotUpdate(context) {
      if (!shouldTransformModule(context.file) || !routeModuleMatcher(context.file)) return;
      for (const module of context.modules) {
        context.server.moduleGraph.invalidateModule(module);
      }
      return context.modules;
    },
  };
}

function routeCompilerFacts(
  program: ts.Program | undefined,
  moduleId: string,
): RouteCompilerFacts {
  const sourceFile = program?.getSourceFile(moduleId);
  if (!program || !sourceFile) return {};
  const graph = analyzeRouteDependencyGraph({ program, routeModuleId: moduleId });
  return {
    checker: program.getTypeChecker(),
    dependencyFingerprints: graph.dependencyFingerprints,
    sourceFile,
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
