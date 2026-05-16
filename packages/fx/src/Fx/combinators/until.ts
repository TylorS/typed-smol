import { Effect, Fiber, Scope } from "effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { observe } from "../run/observe.js";

/**
 * Forwards `events` until `signal` emits, then interrupts `events`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const until: {
  <B, E2, R2>(signal: Fx<B, E2, R2>): <A, E, R>(events: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2> =>
    make(
      Effect.fn(function* (sink) {
        const scope = yield* Scope.make();

        yield* signal.pipe(
          observe(() => Fiber.interrupt(eventsFiber)),
          Effect.forkIn(scope),
        );
        const eventsFiber = yield* Effect.forkIn(events.run(sink), scope);

        yield* Fiber.join(eventsFiber).pipe(Effect.onExit((exit) => Scope.close(scope, exit)));
      }),
    ),
);
