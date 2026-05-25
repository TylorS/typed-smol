/**
 * Type-safe Layer composition helpers for App/run.
 * Uses Effect's Layer.Success, Layer.Error, Layer.Services, Layer.Any directly.
 */
import * as Layer from "effect/Layer";

export type LayerAny = Layer.Any;
type ConcreteLayerAny = Layer.Layer<never, any, any>;

/** Single layer or non-empty array (uses Layer.mergeAll internally). */
export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];

function isLayerArray(l: LayerOrGroup): l is readonly [LayerAny, ...ReadonlyArray<LayerAny>] {
  return Array.isArray(l) && l.length > 0;
}

function toLayer(l: LayerOrGroup): ConcreteLayerAny {
  if (isLayerArray(l)) {
    return Layer.mergeAll(
      Layer.empty,
      ...l.map(toLayer),
    );
  }
  return l as ConcreteLayerAny;
}

/**
 * Composes base layer with layers via provideMerge. Layers are provided TO the base.
 * For precise output type, use ComposeWithLayers<Base, NormalizedLayers<Layers>>.
 */
export function composeWithLayers<
  Base extends ConcreteLayerAny,
  const Layers extends ReadonlyArray<LayerOrGroup>,
>(base: Base, layers: Layers): ComputeLayers<Layers, Base>;
export function composeWithLayers<Base extends ConcreteLayerAny>(base: Base, layers?: undefined): Base;
export function composeWithLayers<
  Base extends ConcreteLayerAny,
  const Layers extends ReadonlyArray<LayerOrGroup>,
>(base: Base, layers?: Layers): ConcreteLayerAny {
  if (layers === undefined) return base;
  if (layers.length === 0) return base;
  let out: ConcreteLayerAny = base;
  for (const layer of layers) {
    out = Layer.provideMerge(out, toLayer(layer));
  }

  return out;
}

export type ComputeLayers<
  Layers extends ReadonlyArray<LayerOrGroup>,
  R extends ConcreteLayerAny,
> = readonly [] extends Layers
  ? R
  : Layers extends readonly [
        infer Head extends LayerOrGroup,
        ...infer Tail extends ReadonlyArray<LayerOrGroup>,
      ]
    ? ComputeLayers<Tail, ProvideMerge<R, ComputeLayer<Head>>>
    : R;

export type ProvideMerge<A extends LayerAny, B extends LayerAny> = Layer.Layer<
  Layer.Success<A | B>,
  Layer.Error<A | B>,
  Exclude<Layer.Services<A>, Layer.Success<B>> | Layer.Services<B>
>;

export type Provide<A extends LayerAny, B extends LayerAny> = Layer.Layer<
  Layer.Success<A | B>,
  Layer.Error<A | B>,
  Exclude<Layer.Services<A>, Layer.Success<B>> | Layer.Services<B>
>;

type ComputeLayer<L extends LayerOrGroup> =
  L extends ReadonlyArray<LayerAny>
    ? Layer.Layer<Layer.Success<L[number]>, Layer.Error<L[number]>, Layer.Services<L[number]>>
    : L extends LayerAny
      ? Layer.Layer<Layer.Success<L>, Layer.Error<L>, Layer.Services<L>>
      : never;

/** Normalizes LayerOrGroup to a single Layer at runtime. Arrays use Layer.mergeAll. */
export function normalizeLayerInput<L extends LayerOrGroup>(input: L): LayerAny {
  return toLayer(input);
}
