import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { flatMapConcurrently } from "./flatMapConcurrently.js";

/**
 * Maps each element of an Fx to an Effect, running them concurrently with a limit.
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @param concurrency - A positive safe-integer limit for concurrent effects. Invalid limits fail with `Cause.IllegalArgumentError`.
 * @returns An `Fx` that emits the results of the effects.
 * @since 1.0.0
 * @category combinators
 */
export const flatMapConcurrentlyEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope> =>
    flatMapConcurrently(self, flow(f, fromEffect), concurrency),
);
