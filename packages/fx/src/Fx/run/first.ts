import { head } from "effect/Array"
import type { Effect } from "effect/Effect"
import { map } from "effect/Effect"
import { pipe } from "effect/Function"
import type { Option } from "effect/Option"
import type { Fx } from "../Fx.js"
import { collectUpTo } from "./collect.js"

/**
 * Returns the first value emitted by the `Fx` wrapped in an `Option`.
 * If the `Fx` is empty, returns `None`.
 *
 * @param fx - The `Fx` stream.
 * @returns An `Effect` that produces `Some(firstValue)` or `None`.
 * @since 1.0.0
 * @category runners
 */
export function first<A, E, R>(fx: Fx<A, E, R>): Effect<Option<A>, E, R> {
  return pipe(fx, collectUpTo(1), map(head))
}
