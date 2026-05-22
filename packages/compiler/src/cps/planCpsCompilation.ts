import type {
  CompileCapabilitiesPlan,
  HmrCompileRejected,
  TemplateCompileCapability,
} from "../capabilities/compileCapabilities.js";
import type { ViteHmrServicePlan } from "../hmr/viteHmr.js";
import type { TemplateOutputTarget } from "../template/fingerprints.js";

export interface CpsCompilationPlan {
  readonly moduleId: string;
  readonly continuations: readonly CpsContinuation[];
  readonly diagnostics: readonly CpsDiagnostic[];
}

export type CpsContinuation = TemplateOutputContinuation | HmrStateContinuation;

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

export interface CpsDiagnostic {
  readonly code: "hmr-rejected";
  readonly moduleId: string;
  readonly reason: HmrCompileRejected["reason"];
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
