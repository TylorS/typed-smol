import type { Renderable } from "@typed/template";
import * as Effect from "effect/Effect";
import type {
  DomRuntimeTemplate,
  HydrateOptions,
  MountedApp,
} from "./RuntimeTemplate.js";
import { mount } from "./mount.js";

export function hydrate<Values extends ReadonlyArray<Renderable.Any>>(
  template: DomRuntimeTemplate<Values>,
  options: HydrateOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Renderable.Services<Values[number]>
> {
  return mount(template, options);
}
