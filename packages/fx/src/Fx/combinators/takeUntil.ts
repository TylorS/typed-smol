import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as combinators from "../../Sink/combinators.js";
import { make as makeSink } from "../../Sink/Sink.js";
import { make as makeFx } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Takes elements from an Fx until a predicate returns true.
 * The element that satisfies the predicate is not included in the output.
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that completes when the predicate matches.
 * @since 1.0.0
 * @category combinators
 */
export const takeUntil: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> => {
  return makeFx<A, E, R>((sink) =>
    combinators.withEarlyExit(sink, (sink) =>
      fx.run(
        makeSink(sink.onFailure, (a) => {
          if (predicate(a)) {
            return sink.earlyExit;
          }
          return sink.onSuccess(a);
        }),
      ),
    ),
  );
});

/**
 * Takes elements from an Fx until an effectful predicate returns true.
 * The element that satisfies the predicate is not included in the output.
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that completes when the predicate matches.
 * @since 1.0.0
 * @category combinators
 */
export const takeUntilEffect: {
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
      combinators.withEarlyExit(sink, (sink) =>
        fx.run(
          makeSink(sink.onFailure, (a) =>
            Effect.matchCauseEffect(predicate(a), {
              onFailure: sink.onFailure,
              onSuccess: (matches) => (matches ? sink.earlyExit : sink.onSuccess(a)),
            }),
          ),
        ),
      ),
    ),
);

/**
 * Drops elements from an Fx after a predicate returns true.
 * The element that satisfies the predicate is included in the output.
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that stops emitting when the predicate matches.
 * @since 1.0.0
 * @category combinators
 */
export const dropAfter: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
    makeFx<A, E, R>((sink) => combinators.dropAfter(sink, predicate, (sink) => fx.run(sink))),
);
