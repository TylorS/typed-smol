import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { unwrap } from "./unwrap.js";

/**
 * Defines the bounds for slicing an Fx stream.
 * @since 1.0.0
 * @category models
 */
export interface Bounds {
  readonly skip: number;
  readonly take: number;
}

/**
 * Slices an Fx by skipping a number of elements and then taking a number of elements.
 *
 * @param bounds - The `Bounds` specifying how many elements to skip and take.
 * @returns An `Fx` representing the slice.
 * @since 1.0.0
 * @category combinators
 */
export const slice: {
  (bounds: Bounds): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, bounds: Bounds): Fx<A, E, R>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, bounds: Bounds): Fx<A, E, R> =>
    make<A, E, R>((sink) => sinkCore.slice(sink, bounds, (sink) => fx.run(sink))),
);

/**
 * Slices an Fx with bounds produced by an Effect.
 *
 * @param bounds - Effect that produces slice bounds.
 * @returns An `Fx` representing the slice.
 * @since 1.0.0
 * @category combinators
 */
export const sliceEffect: {
  <E2, R2>(
    bounds: Effect.Effect<Bounds, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, bounds: Effect.Effect<Bounds, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    bounds: Effect.Effect<Bounds, E2, R2>,
  ): Fx<A, E | E2, R | R2> => unwrap(Effect.map(bounds, (b) => slice(fx, b))),
);
