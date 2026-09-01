import { dual } from "effect/Function";
import { Fx } from "../Fx.js";
import { Duration, Effect } from "effect";
import { mapEffect } from "./mapEffect.js";

/**
 * Delays every source value by `duration` while preserving its value and order.
 *
 * @remarks
 * ## Why
 *
 * Per-value delay is useful when pacing downstream work without changing the
 * stream's error type or replacing the producer.
 *
 * ## Ownership and lifetime
 *
 * Each delivered value runs an Effect sleep before reaching the sink. Because
 * this uses sequential effectful mapping, later values wait behind earlier
 * sleeps and arrival order is preserved. Source failures propagate; interrupting
 * the subscription interrupts the active sleep. No external resource is retained.
 *
 * @example
 * ```ts
 * import { delay } from "@typed/fx/Fx"
 * import { fromIterable } from "@typed/fx/Fx"
 *
 * const paced = delay(fromIterable([1, 2, 3]), "100 millis")
 * ```
 *
 * @since 1.0.0
 * @category combinators
 */
export const delay: {
  (duration: Duration.Input): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input) =>
  mapEffect(self, (a) => Effect.as(Effect.sleep(duration), a)),
);
