import {
  type CompiledDomTemplate,
} from "@typed/compiler/template/emitDomTemplate";
import type { CompiledServerTemplate } from "@typed/compiler/template/emitServerTemplate";
import {
  isTemplateFallback,
  type RuntimeTemplateFallback,
} from "@typed/compiler/template/fallback";
import type { Renderable } from "@typed/template";

export { isTemplateFallback };

export function isCompiledDomTemplate(value: unknown): value is CompiledDomTemplate {
  return isRecord(value) && typeof value.renderInto === "function";
}

export function isCompiledServerTemplate(value: unknown): value is CompiledServerTemplate {
  return isRecord(value) && typeof value.renderToString === "function";
}

export function assertDomTemplate<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate | RuntimeTemplateFallback<Values>,
): asserts template is CompiledDomTemplate | RuntimeTemplateFallback<Values> {
  if (isCompiledDomTemplate(template) || isTemplateFallback(template)) return;
  throw new TypeError("Expected a compiled DOM template or runtime fallback template");
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}
