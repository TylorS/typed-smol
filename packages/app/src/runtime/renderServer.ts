import type { CompiledServerTemplate, RuntimeTemplateFallback } from "@typed/compiler";
import {
  HtmlRenderTemplate,
  renderToHtmlString,
  type Renderable,
  type RenderTemplate,
} from "@typed/template";
import * as Effect from "effect/Effect";
import {
  emptyValues,
  type ServerRenderOptions,
  type ServerRenderResult,
  type ServerRuntimeTemplate,
} from "./RuntimeTemplate.js";
import { isCompiledServerTemplate, isTemplateFallback } from "./internal.js";

export function renderServer<Values extends ReadonlyArray<Renderable.Any>>(
  template: ServerRuntimeTemplate<Values>,
  options: ServerRenderOptions<Values> = {},
): Effect.Effect<
  ServerRenderResult,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  if (isCompiledServerTemplate(template)) return renderCompiled(template, options);
  if (isTemplateFallback(template)) return renderFallback(template, options);
  return Effect.die(
    new TypeError("Expected a compiled server template or runtime fallback template"),
  );
}

function renderCompiled<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledServerTemplate,
  options: ServerRenderOptions<Values>,
): Effect.Effect<ServerRenderResult> {
  return Effect.promise(async () => ({
    html: await template.renderToString(options.values ?? emptyValues()),
  }));
}

function renderFallback<Values extends ReadonlyArray<Renderable.Any>>(
  template: RuntimeTemplateFallback<Values>,
  options: ServerRenderOptions<Values>,
): Effect.Effect<
  ServerRenderResult,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return Effect.map(
    renderToHtmlString(template.render(...(options.values ?? emptyValues()))).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
    ),
    (html) => ({ html }),
  );
}
