import type {
  CompiledDomTemplate,
  CompiledServerTemplate,
  RuntimeTemplateFallback,
} from "@typed/compiler";
import type { Fx } from "@typed/fx";
import type { Renderable, RenderEvent } from "@typed/template";
import * as Effect from "effect/Effect";

export type RuntimeTemplate<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> = CompiledDomTemplate | CompiledServerTemplate | RuntimeTemplateFallback<Values>;

export type DomRuntimeTemplate<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> = CompiledDomTemplate | RuntimeTemplateFallback<Values> | Fx.Fx<RenderEvent, any, any>;

export type ServerRuntimeTemplate<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> = CompiledServerTemplate | RuntimeTemplateFallback<Values>;

export interface MountOptions<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> {
  readonly root: HTMLElement;
  readonly values?: Values;
}

export type HydrateOptions<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> = MountOptions<Values>;

export interface ServerRenderOptions<
  Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[],
> {
  readonly values?: Values;
}

export interface MountedApp {
  readonly root: HTMLElement;
  readonly nodes: readonly Node[];
  readonly dispose: Effect.Effect<void>;
}

export interface ServerRenderResult {
  readonly html: string;
}

export function emptyValues<Values extends ReadonlyArray<Renderable.Any>>(): Values {
  return [] as unknown as Values;
}
