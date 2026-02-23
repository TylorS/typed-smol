import * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Transforms the error channel of an Fx using the provided function.
 *
 * Failures (Cause) are mapped via `Cause.map`, so only the typed failure (`Fail`)
 * is transformed; defects and interrupts are preserved unchanged.
 *
 * Mirrors `Effect.mapError`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const mapError: {
  <E, E2>(f: (e: E) => E2): <A, R>(self: Fx<A, E, R>) => Fx<A, E2, R>;

  <A, E, R, E2>(self: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R>;
} = dual(
  2,
  <A, E, R, E2>(self: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R> =>
    make<A, E2, R>((sink) =>
      self.run(makeSink((cause) => sink.onFailure(Cause.map(cause, f)), sink.onSuccess)),
    ),
);
