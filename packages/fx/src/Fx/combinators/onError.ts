import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Adds an `Effect.onError`-style finalizer to an `Fx`.
 *
 * The cleanup is run only if the stream fails (including defects / interrupts
 * carried in the `Cause`).
 *
 * @since 1.0.0
 * @category combinators
 */
export const onError: {
  <E, X, R2>(
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A, E, R | R2>;

  <A, E, R, X, R2>(
    self: Fx<A, E, R>,
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): Fx<A, E, R | R2>;
} = dual(
  2,
  <A, E, R, X, R2>(
    self: Fx<A, E, R>,
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): Fx<A, E, R | R2> =>
    make<A, E, R | R2>((sink) =>
      self.run(
        makeSink(
          (cause) => Effect.flatMap(sink.onFailure(cause), () => Effect.ignore(cleanup(cause))),
          sink.onSuccess,
        ),
      ),
    ),
);
