import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { skipWhile, skipWhileEffect } from "./skipWhile.js";

/**
 * Drops elements from an Fx until a predicate returns true.
 * Emits from the first element for which the predicate returns true (including that element) and all following elements.
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that emits once the predicate first matches.
 * @since 1.0.0
 * @category combinators
 */
export const dropUntil: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
    skipWhile(fx, (a) => !predicate(a)),
);

/**
 * Drops elements from an Fx until an effectful predicate returns true.
 * Emits from the first element for which the predicate effect succeeds with true (including that element) and all following elements.
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that emits once the predicate first matches.
 * @since 1.0.0
 * @category combinators
 */
export const dropUntilEffect: {
  <A, E2, R2>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2> => skipWhileEffect(fx, (a) => Effect.map(predicate(a), (b) => !b)),
);
