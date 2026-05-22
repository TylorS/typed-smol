import type { CompiledDomTemplate, RuntimeTemplateFallback } from "@typed/compiler";
import { type Fx, Fx as FxRuntime } from "@typed/fx";
import { DomRenderTemplate, render, type RenderEvent, type Renderable } from "@typed/template";
import * as Effect from "effect/Effect";
import {
  emptyValues,
  type DomRuntimeTemplate,
  type MountedApp,
  type MountOptions,
} from "./RuntimeTemplate.js";
import { isCompiledDomTemplate, isTemplateFallback } from "./internal.js";

export function mount<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate | RuntimeTemplateFallback<Values>,
  options: MountOptions<Values>,
): Effect.Effect<MountedApp, Renderable.Error<Values[number]>, Renderable.Services<Values[number]>>;
export function mount<E, R>(
  template: Fx.Fx<RenderEvent, E, R>,
  options: MountOptions,
): Effect.Effect<MountedApp, E, R>;
export function mount<Values extends ReadonlyArray<Renderable.Any>, E, R>(
  template: DomRuntimeTemplate<Values> | Fx.Fx<RenderEvent, E, R>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]> | E,
  Renderable.Services<Values[number]> | R
> {
  if (isCompiledDomTemplate(template)) return mountCompiled(template, options);
  if (isTemplateFallback(template)) return mountFallback(template, options);
  if (FxRuntime.isFx(template)) return mountFx(template, options);
  return Effect.die(new TypeError("Expected a DOM runtime template"));
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
      FxRuntime.provide(DomRenderTemplate.using(options.root.ownerDocument)),
      FxRuntime.take(1),
      FxRuntime.collectAll,
      Effect.scoped,
    ),
    () => mountedApp(options.root, Array.from(options.root.childNodes)),
  );
}

function mountFx<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>,
  options: MountOptions,
): Effect.Effect<MountedApp, E, R> {
  return Effect.map(
    render(fx, options.root).pipe(
      FxRuntime.provide(DomRenderTemplate.using(options.root.ownerDocument)),
      FxRuntime.take(1),
      FxRuntime.collectAll,
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
