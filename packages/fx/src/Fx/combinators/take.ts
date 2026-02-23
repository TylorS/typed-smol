import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { slice } from "./slice.js";
import { unwrap } from "./unwrap.js";

/**
 * Takes the first `n` elements from an Fx and then completes.
 *
 * @param n - The number of elements to take.
 * @returns An `Fx` that emits at most `n` elements.
 * @since 1.0.0
 * @category combinators
 */
export const take: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R> => slice(fx, { skip: 0, take: n }));

/**
 * Takes the first `n` elements where `n` is produced by an Effect.
 *
 * @param count - Effect that produces the number of elements to take.
 * @returns An `Fx` that emits at most `n` elements.
 * @since 1.0.0
 * @category combinators
 */
export const takeEffect: {
  <E2, R2>(
    count: Effect.Effect<number, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2> =>
    unwrap(Effect.map(count, (n) => take(fx, n))),
);
