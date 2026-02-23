import * as Effect from "effect/Effect";
import { dual, pipe } from "effect/Function";
import { loop as sinkLoop, loopEffect as sinkLoopEffect } from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { Sink } from "../../Sink.js";

/**
 * Scans the stream with a pure function, emitting the accumulated state after each element.
 * Emits the initial value first, then for each input `a` emits `f(state, a)` and updates state.
 *
 * Semantics align with Effect Stream's `scan`: output is `initial`, `f(initial, a1)`, `f(..., a2)`, ...
 *
 * @param initial - Initial state (first value emitted).
 * @param f - Reducer `(state, value) => nextState`.
 * @returns An `Fx` that emits the accumulated state at each step.
 * @since 1.0.0
 * @category combinators
 */
export const scan: {
  <S, A>(initial: S, f: (s: S, a: A) => S): <E, R>(fx: Fx<A, E, R>) => Fx<S, E, R>;
  <A, E, R, S>(fx: Fx<A, E, R>, initial: S, f: (s: S, a: A) => S): Fx<S, E, R>;
} = dual(
  3,
  <A, E, R, S>(fx: Fx<A, E, R>, initial: S, f: (s: S, a: A) => S): Fx<S, E, R> =>
    make<S, E, R>((sink) =>
      Effect.gen(function* () {
        yield* sink.onSuccess(initial);
        yield* fx.run(
          sinkLoop(sink, initial, (s, a) => {
            const next = f(s, a);
            return [next, next] as const;
          }),
        );
      }),
    ),
);

/**
 * Scans the stream with an effectful function, emitting the accumulated state after each element.
 * Emits the initial value first, then for each input `a` runs `f(state, a)` and emits the resulting state.
 *
 * @param initial - Initial state (first value emitted).
 * @param f - Effectful reducer `(state, value) => Effect<nextState>`.
 * @returns An `Fx` that emits the accumulated state at each step.
 * @since 1.0.0
 * @category combinators
 */
export const scanEffect: {
  <S, A, E2, R2>(
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Fx<S, E | E2, R | R2>;
  <A, E, R, S, E2, R2>(
    fx: Fx<A, E, R>,
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E2, R2>,
  ): Fx<S, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, S, E2, R2>(
    fx: Fx<A, E, R>,
    initial: S,
    f: (s: S, a: A) => Effect.Effect<S, E2, R2>,
  ): Fx<S, E | E2, R | R2> =>
    make<S, E | E2, R | R2>(<RSink>(sink: Sink<S, E | E2, RSink>) =>
      Effect.gen(function* () {
        const services = yield* Effect.services<R | R2 | RSink>();
        yield* sink.onSuccess(initial);
        yield* fx.run(
          sinkLoopEffect(sink, initial, (s, a) =>
            pipe(
              f(s, a),
              Effect.catchCause((cause) => sink.onFailure(cause).pipe(Effect.as(s))),
              Effect.map((next) => [next, next] as const),
              Effect.provideServices(services),
            ),
          ),
        );
      }),
    ),
);
