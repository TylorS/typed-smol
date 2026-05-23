export interface AnalyzeRouteModuleInput {
  readonly moduleId: string;
  readonly sourceText: string;
}

export interface RouteModulePlan {
  readonly moduleId: string;
  readonly services: readonly RouteRefSubjectServiceFact[];
  readonly effectServices: readonly RouteEffectServiceFact[];
  readonly inlineRefSubjects: readonly RouteInlineRefSubjectFact[];
  readonly templates: readonly RouteTemplateFact[];
  readonly closures: readonly RouteClosureFact[];
  readonly diagnostics: readonly RouteDiagnostic[];
}

export interface RouteRefSubjectServiceFact {
  readonly kind: "refsubject-service";
  readonly moduleId: string;
  readonly localName: string;
  readonly serviceId: string;
}

export interface RouteEffectServiceFact {
  readonly kind: "effect-service";
  readonly moduleId: string;
  readonly localName: string;
  readonly serviceId: string;
}

export interface RouteInlineRefSubjectFact {
  readonly moduleId: string;
  readonly localName: string;
  readonly serviceId: string;
  readonly initializerSource: string;
}

export interface RouteTemplateFact {
  readonly moduleId: string;
  readonly localName: string | undefined;
  readonly tagName: string;
}

export interface RouteClosureFact {
  readonly moduleId: string;
  readonly name: string;
  readonly captures: readonly RouteCaptureFact[];
}

export type RouteCaptureFact =
  | {
      readonly kind: "effect-service";
      readonly name: string;
      readonly serviceId: string;
    }
  | {
      readonly kind: "refsubject-service";
      readonly name: string;
      readonly serviceId: string;
    };

export interface RouteDiagnostic {
  readonly code:
    | "anonymous-refsubject-state"
    | "unsupported-dynamic-service-id"
    | "unsupported-closure-capture";
  readonly moduleId: string;
  readonly message: string;
}
