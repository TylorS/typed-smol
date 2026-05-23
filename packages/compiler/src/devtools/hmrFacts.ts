import {
  makeHmrBoundaryId,
  makeTemplateHash,
  type HmrRejectionReason,
  type HmrStatusFact,
  type HmrStatefulStatus,
} from "@typed/devtools-protocol";
import type {
  CompileCapabilitiesPlan,
  HmrCompileRejected,
  TemplateCompileCapability,
} from "../capabilities/compileCapabilities.js";

export type CompilerHmrStatusFact = HmrStatusFact;

export interface CompilerHmrFactOptions {
  readonly timestamp: number;
}

export function createHmrStatusFacts(
  plan: CompileCapabilitiesPlan,
  options: CompilerHmrFactOptions,
): readonly CompilerHmrStatusFact[] {
  const templates = plan.templates;
  if (templates.length === 0) return [createHmrStatusFact(plan, options)];
  return templates.map((template) => createHmrStatusFact(plan, options, template));
}

function createHmrStatusFact(
  plan: CompileCapabilitiesPlan,
  options: CompilerHmrFactOptions,
  template?: TemplateCompileCapability,
): CompilerHmrStatusFact {
  return {
    _tag: "HmrStatus",
    boundaryId: makeHmrBoundaryId(boundaryKey(plan, template)),
    moduleId: plan.moduleId,
    stateful: statefulStatus(plan),
    template: templateStatus(template),
    timestamp: options.timestamp,
  };
}

function boundaryKey(
  plan: CompileCapabilitiesPlan,
  template: TemplateCompileCapability | undefined,
): string {
  const templateKey = template ? `#${template.templateHash}` : "";
  return `${plan.moduleId}#${plan.boundary}${templateKey}`;
}

function templateStatus(
  template: TemplateCompileCapability | undefined,
): CompilerHmrStatusFact["template"] {
  if (!template) return { optimized: false };
  return {
    optimized: template.strategy === "optimized-html",
    templateHash: makeTemplateHash(template.templateHash),
  };
}

function statefulStatus(plan: CompileCapabilitiesPlan): HmrStatefulStatus {
  const reasons = rejectionReasons(plan);
  if (reasons.length > 0) return { _tag: "Rejected", reasons };
  if (plan.hmr.eligible) {
    return {
      _tag: "Eligible",
      serviceIds: sortedServiceIds(plan),
    };
  }
  if (plan.boundary !== "route-component") {
    return { _tag: "Rejected", reasons: ["incompatible-boundary"] };
  }
  return { _tag: "Unknown", reason: "No stateful HMR services were inferred." };
}

function rejectionReasons(plan: CompileCapabilitiesPlan): readonly HmrRejectionReason[] {
  return uniqueReasons([
    ...plan.hmr.rejected.map(compilerRejectionReason),
    ...(plan.hmr.eligible ? [] : boundaryRejectionReasons(plan)),
  ]);
}

function boundaryRejectionReasons(plan: CompileCapabilitiesPlan): readonly HmrRejectionReason[] {
  if (plan.boundary !== "route-component") return ["incompatible-boundary"];
  return [];
}

function compilerRejectionReason(rejected: HmrCompileRejected): HmrRejectionReason {
  if (rejected.reason === "anonymous-refsubject-state") return "anonymous-refsubject";
  return rejected.reason;
}

function sortedServiceIds(plan: CompileCapabilitiesPlan): readonly string[] {
  return [...plan.hmr.services]
    .sort((left, right) => {
      const moduleOrder = left.moduleId.localeCompare(right.moduleId);
      return moduleOrder === 0 ? left.serviceId.localeCompare(right.serviceId) : moduleOrder;
    })
    .map((service) => service.serviceId);
}

function uniqueReasons(reasons: readonly HmrRejectionReason[]): readonly HmrRejectionReason[] {
  return [...new Set(reasons)];
}
