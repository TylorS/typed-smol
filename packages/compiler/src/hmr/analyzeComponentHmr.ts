import { analyzeRouteModule } from "../route/analyzeRouteModule.js";

export type ComponentHmrBoundary = "route-component" | "dependency" | "template";

export interface ComponentHmrInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly boundary: ComponentHmrBoundary;
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
    moduleId: input.moduleId,
    sourceText: input.sourceText,
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
