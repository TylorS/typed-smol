import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Adds an `Effect.ensuring`-style finalizer to an `Fx`.
 *
 * The finalizer is guaranteed to run when the stream terminates (success,
 * failure, or interruption).
 *
 * @since 1.0.0
 * @category combinators
 */
export const ensuring: {
  <R2>(finalizer: Effect.Effect<void, never, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R | R2>;

  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<void, never, R2>): Fx<A, E, R | R2>;
} = dual(
  2,
  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<void, never, R2>): Fx<A, E, R | R2> =>
    make<A, E, R | R2>((sink) => self.run(sink).pipe(Effect.ensuring(finalizer))),
);
