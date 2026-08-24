import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Pull from "effect/Pull";
import * as Ref from "effect/Ref";
import * as Result from "effect/Result";
import * as Schedule from "effect/Schedule";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Retries the entire stream according to `schedule` when it fails with a typed
 * `Fail`. Defects and interrupts are not retried.
 *
 * The schedule is reset as soon as the first element of an attempt is emitted,
 * matching Effect `Stream.retry`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const retry: {
  <E, X, E2, R2>(
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>(<RSink>(sink: Sink<A, E | E2, RSink>) =>
      Effect.gen(function* () {
        const stepRef = yield* Ref.make<(input: E) => Pull.Pull<X, E2, X, R2>>(
          yield* Schedule.toStepWithSleep(schedule),
        );

        const reset = Effect.flatMap(Schedule.toStepWithSleep(schedule), (step) =>
          Ref.set(stepRef, step),
        );

        const attempt = (): Effect.Effect<unknown, never, R | R2 | RSink> =>
          self.run(
            makeSink(
              (cause: Cause.Cause<E>) => {
                const found = Cause.findFail(cause);
                if (Result.isFailure(found)) {
                  return sink.onFailure(cause);
                }
                return Effect.flatMap(Ref.get(stepRef), (step) =>
                  Pull.matchEffect(step(found.success.error), {
                    onSuccess: () => attempt(),
                    onFailure: (stepCause) => sink.onFailure(stepCause),
                    onDone: () => sink.onFailure(cause),
                  }),
                );
              },
              (a: A) => reset.pipe(Effect.andThen(sink.onSuccess(a))),
            ),
          );

        yield* attempt();
      }),
    ),
);
