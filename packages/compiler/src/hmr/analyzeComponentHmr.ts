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

const inlineRefSubjectPattern =
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:yield\*\s*)?RefSubject\.make\(([^)]*)\)/g;

const refSubjectServicePattern =
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*RefSubject\.Service(?:<[^>]*>)?\(\)\("([^"]+)"\)/g;

export function analyzeComponentHmr(input: ComponentHmrInput): ComponentHmrResult {
  if (input.boundary === "template") {
    return { moduleId: input.moduleId, boundary: input.boundary, eligible: false, services: [] };
  }

  const services = [
    ...findInlineRefSubjects(input.moduleId, input.sourceText),
    ...findRefSubjectServices(input.sourceText),
  ];

  return {
    moduleId: input.moduleId,
    boundary: input.boundary,
    eligible: services.length > 0,
    services,
  };
}

function findInlineRefSubjects(
  moduleId: string,
  sourceText: string,
): readonly InlineRefSubjectDescriptor[] {
  return [...sourceText.matchAll(inlineRefSubjectPattern)].map((match) => ({
    kind: "inline-refsubject",
    localName: match[1],
    serviceId: `${moduleId}#${match[1]}`,
    initializerSource: match[2].trim(),
  }));
}

function findRefSubjectServices(sourceText: string): readonly RefSubjectServiceDescriptor[] {
  return [...sourceText.matchAll(refSubjectServicePattern)].map((match) => ({
    kind: "refsubject-service",
    localName: match[1],
    serviceId: match[2],
  }));
}
