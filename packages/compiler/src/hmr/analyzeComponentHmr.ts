import { analyzeRouteModule } from "../route/analyzeRouteModule.js";
import type { AnalyzeRouteModuleInput } from "../route/RouteModulePlan.js";

export type ComponentHmrBoundary = "route-component" | "dependency" | "template";

export interface ComponentHmrInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly boundary: ComponentHmrBoundary;
  readonly checker?: AnalyzeRouteModuleInput["checker"];
  readonly refSubjectType?: AnalyzeRouteModuleInput["refSubjectType"];
  readonly sourceFile?: AnalyzeRouteModuleInput["sourceFile"];
  readonly ts?: AnalyzeRouteModuleInput["ts"];
}

export interface ComponentHmrResult {
  readonly moduleId: string;
  readonly boundary: ComponentHmrBoundary;
  readonly eligible: boolean;
  readonly services: readonly ComponentHmrServiceDescriptor[];
}

export type ComponentHmrServiceDescriptor =
  | InlineRefSubjectDescriptor
  | RefSubjectServiceDescriptor;

export interface InlineRefSubjectDescriptor {
  readonly kind: "inline-refsubject";
  readonly localName: string;
  readonly serviceId: string;
  readonly initializerSource: string;
}

export interface RefSubjectServiceDescriptor {
  readonly kind: "refsubject-service";
  readonly localName: string;
  readonly serviceId: string;
}

export function analyzeComponentHmr(input: ComponentHmrInput): ComponentHmrResult {
  if (input.boundary === "template") {
    return { moduleId: input.moduleId, boundary: input.boundary, eligible: false, services: [] };
  }

  const route = analyzeRouteModule({
    checker: input.checker,
    moduleId: input.moduleId,
    refSubjectType: input.refSubjectType,
    sourceFile: input.sourceFile,
    sourceText: input.sourceText,
    ts: input.ts,
  });
  const services = [
    ...route.inlineRefSubjects.map((ref) => ({
      kind: "inline-refsubject" as const,
      localName: ref.localName,
      serviceId: ref.serviceId,
      initializerSource: ref.initializerSource,
    })),
    ...route.services.map((service) => ({
      kind: "refsubject-service" as const,
      localName: service.localName,
      serviceId: service.serviceId,
    })),
  ];

  return {
    moduleId: input.moduleId,
    boundary: input.boundary,
    eligible: services.length > 0,
    services,
  };
}
