import type {
  CompileCapabilitiesPlan,
  HmrCompileRejected,
  TemplateCompileCapability,
} from "../capabilities/compileCapabilities.js";
import type { ViteHmrServicePlan } from "../hmr/viteHmr.js";
import type {
  RouteCaptureFact,
  RouteClosureFact,
  RouteClosureParameterFact,
  RouteModulePlan,
} from "../route/RouteModulePlan.js";
import type { TemplateOutputTarget } from "../template/fingerprints.js";

export interface CpsCompilationPlan {
  readonly moduleId: string;
  readonly continuations: readonly CpsContinuation[];
  readonly diagnostics: readonly CpsDiagnostic[];
}

export type CpsContinuation =
  | TemplateOutputContinuation
  | HmrStateContinuation
  | RouteClosureContinuation;

export interface TemplateOutputContinuation {
  readonly id: string;
  readonly kind: "template-output";
  readonly moduleId: string;
  readonly templateHash: string;
  readonly target: TemplateOutputTarget;
  readonly strategy: "optimized-html";
}

export interface HmrStateContinuation {
  readonly id: string;
  readonly kind: "hmr-state";
  readonly moduleId: string;
  readonly serviceId: string;
  readonly shapeFingerprint: string;
  readonly dependencyFingerprints: readonly string[];
  readonly compatibilityFingerprint: string;
  readonly version: string;
}

export interface RouteClosureContinuation {
  readonly id: string;
  readonly kind: "route-closure";
  readonly moduleId: string;
  readonly symbolId: string;
  readonly closureName: string;
  readonly captures: readonly RouteCaptureFact[];
  readonly parameters: readonly RouteClosureParameterFact[];
  readonly serviceIds: readonly string[];
  readonly templateHashes: readonly string[];
  readonly dependencyFingerprints: readonly string[];
  readonly compatibilityFingerprint: string;
  readonly version: string;
}

export interface CpsDiagnostic {
  readonly code: "hmr-rejected";
  readonly moduleId: string;
  readonly reason: HmrCompileRejected["reason"];
}

export interface RouteCpsCompilationOptions {
  readonly dependencyFingerprints?: readonly string[];
  readonly templateHashes?: readonly string[];
  readonly version?: string;
}

export function planCpsCompilation(capabilities: CompileCapabilitiesPlan): CpsCompilationPlan {
  return {
    moduleId: capabilities.moduleId,
    continuations: [
      ...capabilities.templates.flatMap((template) =>
        template.targets.map((target) =>
          templateContinuation(capabilities.moduleId, template, target),
        ),
      ),
      ...capabilities.hmr.services.map(hmrContinuation),
    ],
    diagnostics: capabilities.hmr.rejected.map(hmrDiagnostic),
  };
}

function templateContinuation(
  moduleId: string,
  template: TemplateCompileCapability,
  target: TemplateOutputTarget,
): TemplateOutputContinuation {
  return {
    id: `${moduleId}#template:${template.templateHash}:${target}`,
    kind: "template-output",
    moduleId,
    templateHash: template.templateHash,
    target,
    strategy: template.strategy,
  };
}

function hmrContinuation(service: ViteHmrServicePlan): HmrStateContinuation {
  return {
    id: `${service.moduleId}#hmr:${service.serviceId}`,
    kind: "hmr-state",
    moduleId: service.moduleId,
    serviceId: service.serviceId,
    shapeFingerprint: service.shapeFingerprint,
    dependencyFingerprints: service.dependencyFingerprints,
    compatibilityFingerprint: service.compatibilityFingerprint,
    version: service.version,
  };
}

function hmrDiagnostic(rejected: HmrCompileRejected): CpsDiagnostic {
  return {
    code: "hmr-rejected",
    moduleId: rejected.moduleId,
    reason: rejected.reason,
  };
}

export function planRouteCpsCompilation(
  route: RouteModulePlan,
  options: RouteCpsCompilationOptions = {},
): CpsCompilationPlan {
  const dependencyFingerprints = [...(options.dependencyFingerprints ?? [])].sort();
  const templateHashes = [...(options.templateHashes ?? [])].sort();
  const version = options.version ?? "1";

  return {
    moduleId: route.moduleId,
    continuations: route.closures
      .filter((closure) => closure.captures.length > 0 || closure.parameters.length > 0)
      .map((closure) => routeClosureContinuation(route.moduleId, closure, {
        dependencyFingerprints,
        templateHashes,
        version,
      })),
    diagnostics: [],
  };
}

function routeClosureContinuation(
  moduleId: string,
  closure: RouteClosureFact,
  options: Required<RouteCpsCompilationOptions>,
): RouteClosureContinuation {
  const symbolId = `${moduleId}#closure:${closure.name}`;
  const captures = stableCaptures(closure.captures);
  const parameters = stableParameters(closure.parameters);
  return {
    captures,
    closureName: closure.name,
    compatibilityFingerprint: routeClosureCompatibility(symbolId, captures, parameters, options),
    dependencyFingerprints: options.dependencyFingerprints,
    id: symbolId,
    kind: "route-closure",
    moduleId,
    parameters,
    serviceIds: serviceIds(captures),
    symbolId,
    templateHashes: options.templateHashes,
    version: options.version,
  };
}

function routeClosureCompatibility(
  symbolId: string,
  captures: readonly RouteCaptureFact[],
  parameters: readonly RouteClosureParameterFact[],
  options: Required<RouteCpsCompilationOptions>,
): string {
  return JSON.stringify({
    captures: captures.map(captureFingerprint),
    dependencyFingerprints: options.dependencyFingerprints,
    parameters: parameters.map(parameterFingerprint),
    symbolId,
    version: options.version,
  });
}

function stableCaptures(captures: readonly RouteCaptureFact[]): readonly RouteCaptureFact[] {
  return [...captures].sort((left, right) => captureFingerprint(left).localeCompare(captureFingerprint(right)));
}

function serviceIds(captures: readonly RouteCaptureFact[]): readonly string[] {
  return [
    ...new Set(
      captures.flatMap((capture) =>
        capture.kind === "effect-service" || capture.kind === "refsubject-service"
          ? [capture.serviceId]
          : [],
      ),
    ),
  ].sort();
}

function stableParameters(
  parameters: readonly RouteClosureParameterFact[],
): readonly RouteClosureParameterFact[] {
  return [...parameters].sort((left, right) => left.index - right.index);
}

function parameterFingerprint(parameter: RouteClosureParameterFact): string {
  return `${parameter.index}:${parameter.name}:${parameter.serviceId}`;
}

function captureFingerprint(capture: RouteCaptureFact): string {
  if (capture.kind === "effect-service" || capture.kind === "refsubject-service") {
    return `${capture.kind}:${capture.name}:${capture.serviceId}`;
  }
  if (capture.kind === "context-capture" || capture.kind === "serializable-value") {
    return `${capture.kind}:${capture.name}:${capture.initializerSource}`;
  }
  if (capture.kind === "unsupported") return `${capture.kind}:${capture.name}:${capture.reason}`;
  return `${capture.kind}:${capture.name}`;
}
