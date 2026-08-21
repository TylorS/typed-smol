import { dual, flow } from "effect/Function";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { flatMapConcurrently } from "./flatMapConcurrently.js";
import type { FlatMapLike } from "./flatMap.js";
import type { FlatMapEffectLike } from "./flatMapEffect.js";

/**
 * Maps each element to an inner Fx and concatenates the results sequentially.
 *
 * Equivalent to RxJS `concatMap` and to Effect `Stream.flatMap` with default
 * (sequential) concurrency. Use {@link flatMap} for unbounded concurrent merge.
 *
 * @since 1.0.0
 * @category combinators
 */
export const concatMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => flatMapConcurrently(self, f, 1),
);

/**
 * Maps each element to an Effect and concatenates the results sequentially.
 *
 * @since 1.0.0
 * @category combinators
 */
export const concatMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => concatMap(self, flow(f, fromEffect)),
);
