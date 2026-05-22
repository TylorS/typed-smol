import type { CompiledDomTemplate, RuntimeTemplateFallback } from "@typed/compiler";
import { Fx } from "@typed/fx";
import {
  DomRenderTemplate,
  render,
  type Renderable,
} from "@typed/template";
import * as Effect from "effect/Effect";
import {
  emptyValues,
  type DomRuntimeTemplate,
  type MountedApp,
  type MountOptions,
} from "./RuntimeTemplate.js";
import { isCompiledDomTemplate, isTemplateFallback } from "./internal.js";

export function mount<Values extends ReadonlyArray<Renderable.Any>>(
  template: DomRuntimeTemplate<Values>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Renderable.Services<Values[number]>
> {
  if (isCompiledDomTemplate(template)) return mountCompiled(template, options);
  if (isTemplateFallback(template)) return mountFallback(template, options);
  return Effect.die(new TypeError("Expected a compiled DOM template or runtime fallback template"));
}

function mountCompiled<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate,
  options: MountOptions<Values>,
): Effect.Effect<MountedApp> {
  return Effect.promise(async () => {
    const nodes = await template.renderInto(options.root, options.values ?? emptyValues());
    return mountedApp(options.root, nodes);
  });
}

function mountFallback<Values extends ReadonlyArray<Renderable.Any>>(
  template: RuntimeTemplateFallback<Values>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Renderable.Services<Values[number]>
> {
  return Effect.map(
    render(template.render(...(options.values ?? emptyValues())), options.root).pipe(
      Fx.provide(DomRenderTemplate.using(options.root.ownerDocument)),
      Fx.take(1),
      Fx.collectAll,
      Effect.scoped,
    ),
    () => mountedApp(options.root, Array.from(options.root.childNodes)),
  );
}

function mountedApp(root: HTMLElement, nodes: readonly Node[]): MountedApp {
  return {
    root,
    nodes,
    dispose: Effect.sync(() => root.replaceChildren()),
  };
}
