import type ts from "typescript";

export interface AnalyzeRouteModuleInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly checker?: ts.TypeChecker;
  readonly refSubjectType?: ts.Type;
  readonly sourceFile?: ts.SourceFile;
  readonly ts?: typeof ts;
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
      readonly serviceName?: string;
    }
  | {
      readonly kind: "refsubject-service";
      readonly name: string;
      readonly serviceId: string;
      readonly serviceName?: string;
    }
  | {
      readonly kind: "generated-context";
      readonly name: string;
      readonly serviceId: string;
      readonly typeText: string;
    }
  | {
      readonly kind: "template-value";
      readonly name: string;
      readonly templateHash?: string;
    }
  | {
      readonly kind: "serializable-value";
      readonly name: string;
      readonly descriptorName?: string;
      readonly typeText: string;
    }
  | {
      readonly kind: "inline-refsubject-migration";
      readonly name: string;
      readonly serviceId: string;
      readonly initializerSource: string;
      readonly typeText: string;
    }
  | {
      readonly kind: "unsupported";
      readonly name: string;
      readonly reason:
        | "mutable-local"
        | "unknown-capture"
        | "dynamic-service-id"
        | "non-resumable-event-handler";
      readonly typeText?: string;
    };

export interface RouteDiagnostic {
  readonly code:
    | "anonymous-refsubject-state"
    | "unsupported-dynamic-service-id"
    | "unsupported-closure-capture";
  readonly moduleId: string;
  readonly message: string;
}
