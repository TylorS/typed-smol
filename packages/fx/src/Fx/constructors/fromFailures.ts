import * as Cause from "effect/Cause"
import { flow } from "effect/Function"
import { failCause } from "./failCause.js"

const fromFailuresCause = <E>(failures: Iterable<E>): Cause.Cause<E> =>
  Array.from(failures).reduce(
    (acc, e) => Cause.combine(acc, Cause.fail(e)),
    Cause.empty as Cause.Cause<E>
  )

/**
 * Creates an Fx from a collection of failures (errors).
 *
 * @param failures - An iterable of failures.
 * @returns An `Fx` that fails with the combined failures.
 * @since 1.0.0
 * @category constructors
 */
export const fromFailures = /*#__PURE__*/ flow(fromFailuresCause, failCause)
