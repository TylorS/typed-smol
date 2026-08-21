import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import * as SynchronizedRef from "effect/SynchronizedRef";
import { make as makeSink } from "../../Sink/Sink.js";
import { empty } from "../constructors/empty.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Runs two streams concurrently until one emits, then mirrors the winner and
 * interrupts the other.
 *
 * A failure or completion from one side before the other emits does **not**
 * win unless every side ends without emitting. After a winner is chosen, that
 * stream's later failures are propagated.
 *
 * Matches Effect `Stream.race`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const race: {
  <AR, ER, RR>(that: Fx<AR, ER, RR>): <AL, EL, RL>(self: Fx<AL, EL, RL>) => Fx<AL | AR, EL | ER, RL | RR>;
  <AL, EL, RL, AR, ER, RR>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
  ): Fx<AL | AR, EL | ER, RL | RR>;
} = dual(
  2,
  <AL, EL, RL, AR, ER, RR>(
    self: Fx<AL, EL, RL>,
    that: Fx<AR, ER, RR>,
  ): Fx<AL | AR, EL | ER, RL | RR> => raceAll(self, that),
);

/**
 * Races many streams: the first to emit wins and the rest are interrupted.
 *
 * @since 1.0.0
 * @category combinators
 */
export const raceAll = <FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>> => {
  if (fxs.length === 0) {
    return empty as Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>>;
  }
  if (fxs.length === 1) {
    return fxs[0];
  }

  type A = Fx.Success<FX[number]>;
  type E = Fx.Error<FX[number]>;
  type R = Fx.Services<FX[number]>;

  return make<A, E, R>((sink) =>
    Effect.gen(function* () {
      const winner = yield* SynchronizedRef.make<number | null>(null);
      const ended = yield* Ref.make(0);
      const firstFail = yield* Ref.make<Cause.Cause<E> | null>(null);
      const fibersRef = yield* Ref.make<ReadonlyArray<Fiber.Fiber<unknown, never>>>([]);

      const interruptOthers = (except: number) =>
        Effect.flatMap(Ref.get(fibersRef), (fibers) =>
          Effect.forEach(
            fibers,
            (fiber, i) => (i === except ? Effect.void : Fiber.interrupt(fiber)),
            { discard: true },
          ),
        );

      const markEnded = Effect.gen(function* () {
        const current = yield* SynchronizedRef.get(winner);
        if (current !== null) return;
        const n = yield* Ref.updateAndGet(ended, (count) => count + 1);
        if (n === fxs.length) {
          const cause = yield* Ref.get(firstFail);
          if (cause !== null) {
            yield* sink.onFailure(cause);
          }
        }
      });

      const fibers: Array<Fiber.Fiber<unknown, never>> = [];
      for (let i = 0; i < fxs.length; i++) {
        const fx = fxs[i]!;
        const fiber = yield* Effect.forkChild(
          Effect.flatMap(SynchronizedRef.get(winner), (already) =>
            already !== null
              ? Effect.void
              : fx
                  .run(
                    makeSink(
                      (cause: Cause.Cause<E>) =>
                        Effect.flatMap(SynchronizedRef.get(winner), (w) => {
                          if (w === i) return sink.onFailure(cause);
                          if (w === null && !Cause.hasInterruptsOnly(cause)) {
                            return Ref.update(firstFail, (prev) => prev ?? cause);
                          }
                          return Effect.void;
                        }),
                      (a: A) =>
                        SynchronizedRef.updateEffect(winner, (w) => {
                          if (w === null) {
                            return interruptOthers(i).pipe(
                              Effect.andThen(sink.onSuccess(a)),
                              Effect.as(i),
                            );
                          }
                          if (w === i) {
                            return sink.onSuccess(a).pipe(Effect.as(w));
                          }
                          return Effect.succeed(w);
                        }),
                    ),
                  )
                  .pipe(Effect.ensuring(markEnded)),
          ),
          { startImmediately: true, uninterruptible: false },
        );
        fibers.push(fiber);
      }
      yield* Ref.set(fibersRef, fibers);

      yield* Effect.forEach(
        fibers,
        (fiber) => Fiber.join(fiber).pipe(Effect.catchCause(() => Effect.void)),
        { concurrency: "unbounded", discard: true },
      );
    }),
  );
};
