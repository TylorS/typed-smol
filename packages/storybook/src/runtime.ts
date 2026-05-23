import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const TYPED_STORYBOOK_RUNTIME_PARAMETER = "typed" as const;

export interface TypedStoryRuntimeOptions<
  Layers extends ReadonlyArray<LayerOrGroup> = readonly [],
> {
  readonly layers?: Layers;
  readonly url?: string | URL;
}

export function defineTypedStoryRuntime<const Layers extends ReadonlyArray<LayerOrGroup>>(
  options: TypedStoryRuntimeOptions<Layers>,
): TypedStoryRuntimeOptions<Layers> {
  return options;
}

export function typedStoryRuntimeFromParameters(
  parameters: Record<string, unknown> | undefined,
): TypedStoryRuntimeOptions {
  const runtime = parameters?.[TYPED_STORYBOOK_RUNTIME_PARAMETER];
  return isTypedStoryRuntimeOptions(runtime) ? runtime : {};
}

export function runWithTypedStoryRuntime<A, E>(
  effect: Effect.Effect<A, E, unknown>,
  runtime: TypedStoryRuntimeOptions,
): Promise<A> {
  const layers = runtime.layers;
  if (layers === undefined || layers.length === 0) {
    return Effect.runPromise(effect as Effect.Effect<A, E, never>);
  }

  const layer = composeWithLayers(Layer.empty, layers);
  const provided = Effect.provide(effect, layer as Layer.Layer<never, unknown, unknown>);

  return Effect.runPromise(provided as Effect.Effect<A, E | unknown, never>);
}

function isTypedStoryRuntimeOptions(value: unknown): value is TypedStoryRuntimeOptions {
  return value !== null && typeof value === "object";
}
