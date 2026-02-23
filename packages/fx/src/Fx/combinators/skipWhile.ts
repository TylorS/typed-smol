import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import { make as makeFx } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { make as makeSink } from "../../Sink/Sink.js";

/**
 * Skips elements from an Fx while a predicate returns true.
 * Emits from the first element for which the predicate returns false (including that element) and all following elements.
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that emits once the predicate first fails.
 * @since 1.0.0
 * @category combinators
 */
export const skipWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
    makeFx<A, E, R>((sink) =>
      Effect.gen(function* () {
        const skippingRef = yield* Ref.make(true);
        const skipSink = makeSink(sink.onFailure, (a: A) =>
          Effect.gen(function* () {
            const skipping = yield* Ref.get(skippingRef);
            if (skipping) {
              if (predicate(a)) return;
              yield* Ref.set(skippingRef, false);
            }
            return yield* sink.onSuccess(a);
          }),
        );
        return yield* fx.run(skipSink);
      }),
    ),
);

/**
 * Skips elements from an Fx while an effectful predicate returns true.
 * Emits from the first element for which the predicate effect succeeds with false (including that element) and all following elements.
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that emits once the predicate first fails.
 * @since 1.0.0
 * @category combinators
 */
export const skipWhileEffect: {
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
  ): Fx<A, E | E2, R | R2> =>
    makeFx<A, E | E2, R | R2>((sink) =>
      Effect.gen(function* () {
        const skippingRef = yield* Ref.make(true);
        const skipSink = makeSink(sink.onFailure, (a: A) =>
          Effect.matchCauseEffect(predicate(a), {
            onFailure: sink.onFailure,
            onSuccess: (ok) =>
              Effect.gen(function* () {
                const skipping = yield* Ref.get(skippingRef);
                if (skipping) {
                  if (ok) return;
                  yield* Ref.set(skippingRef, false);
                }
                return yield* sink.onSuccess(a);
              }),
          }),
        );
        return yield* fx.run(skipSink);
      }),
    ),
);

/**
 * Alias of `skipWhile` for Effect parity (`dropWhile` naming).
 *
 * @since 1.0.0
 * @category combinators
 */
export const dropWhile = skipWhile;

/**
 * Alias of `skipWhileEffect` for Effect parity (`dropWhileEffect` naming).
 *
 * @since 1.0.0
 * @category combinators
 */
export const dropWhileEffect = skipWhileEffect;
