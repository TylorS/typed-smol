import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";
import * as TypedRouter from "@typed/router";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const TYPED_STORYBOOK_RUNTIME_PARAMETER = "typed" as const;

export interface TypedStoryRuntimeOptions<
  Layers extends ReadonlyArray<LayerOrGroup> = readonly [],
  TestLayers extends ReadonlyArray<LayerOrGroup> = readonly [],
> {
  readonly api?: readonly string[];
  readonly layers?: Layers;
  readonly path?: `/${string}`;
  readonly routes?: readonly string[];
  readonly testLayers?: TestLayers;
}

export function defineTypedStoryRuntime<
  const Layers extends ReadonlyArray<LayerOrGroup>,
  const TestLayers extends ReadonlyArray<LayerOrGroup> = readonly [],
>(
  options: TypedStoryRuntimeOptions<Layers, TestLayers>,
): TypedStoryRuntimeOptions<Layers, TestLayers> {
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
  const layers = runtimeLayers(runtime);
  if (layers.length === 0) {
    return Effect.runPromise(effect as Effect.Effect<A, E, never>);
  }

  const layer = composeWithLayers(Layer.empty, layers);
  const provided = Effect.provide(effect, layer as Layer.Layer<never, unknown, unknown>);

  return Effect.runPromise(provided as Effect.Effect<A, E | unknown, never>);
}

function isTypedStoryRuntimeOptions(value: unknown): value is TypedStoryRuntimeOptions {
  return value !== null && typeof value === "object";
}

function runtimeLayers(runtime: TypedStoryRuntimeOptions): readonly LayerOrGroup[] {
  return [
    ...(runtime.path ? [TypedRouter.TestRouter({ url: toLocalUrl(runtime.path) })] : []),
    ...(runtime.layers ?? []),
    ...(runtime.testLayers ?? []),
  ];
}

function toLocalUrl(path: `/${string}`): string {
  return `http://localhost${path}`;
}
