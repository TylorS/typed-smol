import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as FiberSet from "effect/FiberSet";
import * as Semaphore from "effect/Semaphore";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

/**
 * Maps each element of an Fx to a new Fx, running them concurrently with a limit.
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @param concurrency - A positive safe-integer limit for concurrent inner streams. Invalid limits fail with `Cause.IllegalArgumentError`.
 * @returns An `Fx` that emits values from the inner streams.
 * @since 1.0.0
 * @category combinators
 */
export const flatMapConcurrently: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope> =>
    make<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        if (!Number.isSafeInteger(concurrency) || concurrency <= 0) {
          return yield* sink.onFailure(
            Cause.fail(
              new Cause.IllegalArgumentError(
                `concurrency must be a positive safe integer, received ${concurrency}`,
              ),
            ),
          );
        }
        const semaphore = yield* Semaphore.make(concurrency);
        const lock = semaphore.withPermits(1);
        const set = yield* FiberSet.make<void, never>();
        yield* self.run(
          makeSink(sink.onFailure, (a) => FiberSet.run(set, lock(Effect.asVoid(f(a).run(sink))))),
        );
        yield* FiberSet.awaitEmpty(set);
      }, extendScope),
    ),
);
