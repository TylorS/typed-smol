import type { Renderable, RenderTemplate } from "@typed/template";
import * as Effect from "effect/Effect";
import type { DomRuntimeTemplate, HydrateOptions, MountedApp } from "./RuntimeTemplate.js";
import { mount } from "./mount.js";
import type { Fx } from "@typed/fx";
import type { RenderEvent } from "@typed/template";
import type { CompiledDomTemplate, RuntimeTemplateFallback } from "@typed/compiler";

export function hydrate<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate | RuntimeTemplateFallback<Values>,
  options: HydrateOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
>;
export function hydrate<E, R>(
  template: Fx.Fx<RenderEvent, E, R>,
  options: HydrateOptions,
): Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate>>;
export function hydrate<Values extends ReadonlyArray<Renderable.Any>>(
  template: DomRuntimeTemplate<Values>,
  options: HydrateOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return mount(template as never, options as never);
}
