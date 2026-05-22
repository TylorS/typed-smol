import type * as Scope from "effect/Scope";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import type { Fx } from "@typed/fx";

export const TemplateFallbackTypeId = Symbol.for("@typed/compiler/TemplateFallback");
export type TemplateFallbackTypeId = typeof TemplateFallbackTypeId;

export interface TemplateCompilerDiagnostic {
  readonly kind: "template-compiler-diagnostic";
  readonly code: "typed-template-fallback";
  readonly severity: "warning";
  readonly moduleId: string;
  readonly reason: string;
  readonly message: string;
}

export interface TemplateFallbackInput {
  readonly moduleId: string;
  readonly reason: string;
  readonly template: TemplateStringsArray;
}

export interface RuntimeTemplateFallback<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> {
  readonly [TemplateFallbackTypeId]: TemplateFallbackTypeId;
  readonly kind: "runtime-template-fallback";
  readonly moduleId: string;
  readonly template: TemplateStringsArray;
  readonly diagnostics: readonly [TemplateCompilerDiagnostic];
  readonly render: (
    ...values: Values
  ) => Fx.Fx<
    RenderEvent,
    Renderable.Error<Values[number]>,
    Renderable.Services<Values[number]> | Scope.Scope | RenderTemplate
  >;
}

export function createTemplateFallback<
  const Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
>(input: TemplateFallbackInput): RuntimeTemplateFallback<Values> {
  return {
    [TemplateFallbackTypeId]: TemplateFallbackTypeId,
    kind: "runtime-template-fallback",
    moduleId: input.moduleId,
    template: input.template,
    diagnostics: [createFallbackDiagnostic(input.moduleId, input.reason)],
    render: (...values) => html(input.template, ...values),
  };
}

export function isTemplateFallback(value: unknown): value is RuntimeTemplateFallback {
  return (
    typeof value === "object" &&
    value !== null &&
    TemplateFallbackTypeId in value &&
    (value as { readonly [TemplateFallbackTypeId]: unknown })[TemplateFallbackTypeId] ===
      TemplateFallbackTypeId
  );
}

function createFallbackDiagnostic(moduleId: string, reason: string): TemplateCompilerDiagnostic {
  return {
    kind: "template-compiler-diagnostic",
    code: "typed-template-fallback",
    severity: "warning",
    moduleId,
    reason,
    message: `Fell back to runtime RenderTemplate for ${moduleId}: ${reason}`,
  };
}
