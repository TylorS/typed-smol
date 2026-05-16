import { Effect, Fiber, Scope } from "effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { observe } from "../run/observe.js";
import { filter } from "./filter.js";

/**
 * Drops `events` until `signal` emits, then forwards the rest.
 *
 * @since 1.0.0
 * @category combinators
 */
export const since: {
  <B, E2, R2>(signal: Fx<B, E2, R2>): <A, E, R>(events: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2> =>
    make(
      Effect.fn(function* (sink) {
        let ready = false;

        const scope = yield* Scope.make();
        const eventsFiber = yield* Effect.forkIn(events.pipe(filter(() => ready)).run(sink), scope);

        yield* signal.pipe(
          observe(() => {
            ready = true;
            return Effect.interrupt;
          }),
          Effect.forkIn(scope),
        );

        yield* Fiber.join(eventsFiber).pipe(Effect.onExit((exit) => Scope.close(scope, exit)));
      }),
    ),
);
