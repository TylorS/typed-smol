import type { ComponentHmrBoundary, ComponentHmrResult } from "../hmr/analyzeComponentHmr.js";
import type {
  DependencyHmrParticipant,
  DependencyHmrRejected,
  DependencyHmrResult,
} from "../hmr/dependencies.js";
import { planViteHmrBoundary, type ViteHmrServicePlan } from "../hmr/viteHmr.js";
import type { TemplatePlan } from "../template/TemplatePlan.js";
import type { TemplateOutputTarget } from "../template/fingerprints.js";

export interface CompileCapabilitiesInput {
  readonly moduleId: string;
  readonly boundary: ComponentHmrBoundary;
  readonly templates?: readonly TemplatePlan[];
  readonly component?: ComponentHmrResult;
  readonly dependencies?: DependencyHmrResult;
  readonly hmr?: CompileHmrOptions;
  readonly hmrVersion?: string;
}

export interface CompileHmrOptions {
  readonly enabled?: boolean;
}

export interface CompileCapabilitiesPlan {
  readonly moduleId: string;
  readonly boundary: ComponentHmrBoundary;
  readonly templates: readonly TemplateCompileCapability[];
  readonly hmr: HmrCompileCapability;
}

export interface TemplateCompileCapability {
  readonly templateHash: string;
  readonly targets: readonly TemplateOutputTarget[];
  readonly strategy: "optimized-html";
}

export interface HmrCompileCapability {
  readonly eligible: boolean;
  readonly services: readonly ViteHmrServicePlan[];
  readonly dependencies: readonly DependencyHmrParticipant[];
  readonly rejected: readonly HmrCompileRejected[];
}

export type HmrCompileRejected =
  | DependencyHmrRejected
  | { readonly moduleId: string; readonly reason: "explicit-opt-out" };

const htmlTargets = ["dom", "server"] as const;
const emptyHmr: HmrCompileCapability = {
  eligible: false,
  services: [],
  dependencies: [],
  rejected: [],
};

export function planCompileCapabilities(input: CompileCapabilitiesInput): CompileCapabilitiesPlan {
  return {
    moduleId: input.moduleId,
    boundary: input.boundary,
    templates: (input.templates ?? []).map(templateCapability),
    hmr: hmrCapability(input),
  };
}

function templateCapability(plan: TemplatePlan): TemplateCompileCapability {
  return {
    templateHash: plan.templateHash,
    targets: htmlTargets,
    strategy: "optimized-html",
  };
}

function hmrCapability(input: CompileCapabilitiesInput): HmrCompileCapability {
  if (input.boundary !== "route-component") return emptyHmr;
  if (input.hmr?.enabled === false) {
    return {
      ...emptyHmr,
      rejected: [{ moduleId: input.moduleId, reason: "explicit-opt-out" }],
    };
  }
  if (!input.component) return emptyHmr;

  const boundary = planViteHmrBoundary({
    route: input.component,
    dependencies: input.dependencies,
    version: input.hmrVersion,
  });

  return {
    eligible: boundary.eligible,
    services: boundary.services,
    dependencies: input.dependencies?.participants ?? [],
    rejected: boundary.rejected,
  };
}
