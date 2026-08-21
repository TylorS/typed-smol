import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FiberHandle from "effect/FiberHandle";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { empty } from "../constructors/empty.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

const runTimed = <A, E, R, B, E2, R2>(
  self: Fx<A, E, R>,
  duration: Duration.Duration,
  fallback: Fx<B, E2, R2> | undefined,
): Fx<A | B, E | E2, R | R2 | Scope.Scope> =>
  make<A | B, E | E2, R | R2 | Scope.Scope>(
    Effect.fn(function* (sink) {
      const timedOut = yield* Ref.make(false);
      const sourceFiber = yield* Ref.make<Fiber.Fiber<unknown, never> | null>(null);
      const timer = yield* FiberHandle.make();

      const onTimeout = Effect.gen(function* () {
        yield* Ref.set(timedOut, true);
        const fiber = yield* Ref.get(sourceFiber);
        if (fiber) yield* Fiber.interrupt(fiber);
      });

      const arm = FiberHandle.run(timer, Effect.sleep(duration).pipe(Effect.andThen(onTimeout)));

      const fiber = yield* Effect.forkChild(
        self.run(
          makeSink(
            (cause) =>
              Effect.flatMap(Ref.get(timedOut), (didTimeout) =>
                didTimeout ? Effect.void : sink.onFailure(cause),
              ),
            (a: A) => sink.onSuccess(a).pipe(Effect.andThen(arm)),
          ),
        ),
      );
      yield* Ref.set(sourceFiber, fiber);
      yield* arm;

      yield* Fiber.join(fiber).pipe(Effect.catchCause(() => Effect.void));
      yield* FiberHandle.clear(timer);

      if ((yield* Ref.get(timedOut)) && fallback !== undefined) {
        yield* fallback.run(sink);
      }
    }, extendScope),
  );

/**
 * Completes the stream if it does not produce a value (or complete) within
 * `duration` of the previous event. Matches Effect `Stream.timeout`.
 *
 * The timeout is reset after each emission. An infinite duration is a no-op;
 * a zero duration completes immediately.
 *
 * @since 1.0.0
 * @category combinators
 */
export const timeout: {
  (
    duration: Duration.Input,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope> => {
  const d = Duration.fromInputUnsafe(duration);
  if (!Duration.isFinite(d)) return self;
  if (Duration.isZero(d)) return empty;
  return runTimed(self, d, undefined);
});

/**
 * Switches to `fallback` if the source does not produce a value within
 * `duration` of the previous event. Matches Effect `Stream.timeoutOrElse`
 * and RxJS `timeoutTo`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const timeoutTo: {
  <B, E2, R2>(
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2 | Scope.Scope>;
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope> => {
    const d = Duration.fromInputUnsafe(duration);
    if (!Duration.isFinite(d)) return self;
    if (Duration.isZero(d)) return fallback;
    return runTimed(self, d, fallback);
  },
);
