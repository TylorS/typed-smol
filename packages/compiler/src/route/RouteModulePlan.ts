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
  readonly parameters: readonly RouteClosureParameterFact[];
  readonly captures: readonly RouteCaptureFact[];
}

export interface RouteClosureParameterFact {
  readonly index: number;
  readonly name: string;
  readonly serviceId: string;
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
    }
  | {
      readonly kind: "context-capture";
      readonly name: string;
      readonly initializerSource: string;
    }
  | {
      readonly kind: "serializable-value";
      readonly name: string;
      readonly initializerSource: string;
    }
  | {
      readonly kind: "template-value";
      readonly name: string;
    }
  | {
      readonly kind: "unsupported";
      readonly name: string;
      readonly reason: "mutable-local" | "anonymous-value";
    };

export interface RouteDiagnostic {
  readonly code:
    | "anonymous-refsubject-state"
    | "unsupported-dynamic-service-id"
    | "unsupported-closure-capture";
  readonly moduleId: string;
  readonly message: string;
}
