/**
 * Extensions to RefSubject for working with Cause values
 * @since 1.18.0
 */

import * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefCause is a RefSubject specialized over a Cause value.
 * @since 1.18.0
 * @category models
 */
export interface RefCause<
  in out E,
  in out Err = never,
  out R = never,
> extends RefSubject.RefSubject<Cause.Cause<E>, Err, R> {}

/**
 * Creates a new `RefCause` from a Cause, `Effect`, or `Fx`.
 *
 * @example
 * ```ts
 * import { Effect, Cause } from "effect"
 * import * as RefCause from "effect/typed/fx/RefSubject/RefCause"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefCause.make(Cause.fail("error"))
 *   const current = yield* value
 *   console.log(current) // Cause(...)
 * })
 * ```
 *
 * @since 1.18.0
 * @category constructors
 */
export function make<E = never, Err = never, R = never>(
  initial: Cause.Cause<E> | Effect.Effect<Cause.Cause<E>, Err, R> | Fx.Fx<Cause.Cause<E>, Err, R>,
  eq: Equivalence<Cause.Cause<E>> = equals,
): Effect.Effect<RefCause<E, Err>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Equivalence_.make(eq) });
}

/**
 * Set the current state of a RefCause to a Fail cause.
 * @since 1.18.0
 * @category combinators
 */
export const setFail: {
  <E>(error: E): <Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, error: E): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setFail<E, Err, R>(ref: RefCause<E, Err, R>, error: E) {
  return RefSubject.set(ref, Cause.fail(error));
});

/**
 * Set the current state of a RefCause to a Die cause.
 * @since 1.18.0
 * @category combinators
 */
export const setDie: {
  (defect: unknown): <E, Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, defect: unknown): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setDie<E, Err, R>(ref: RefCause<E, Err, R>, defect: unknown) {
  return RefSubject.set(ref, Cause.die(defect));
});

/**
 * Set the current state of a RefCause to an Interrupt cause.
 * @since 1.18.0
 * @category combinators
 */
export const setInterrupt: {
  (
    fiberId?: number,
  ): <E, Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, fiberId?: number): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setInterrupt<E, Err, R>(ref: RefCause<E, Err, R>, fiberId?: number) {
  return RefSubject.set(ref, Cause.interrupt(fiberId));
});

// ========================================
// Computed
// ========================================

/**
 * Check if the current state of a RefCause has a Fail.
 * @since 1.18.0
 * @category computed
 */
export const hasFails = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasFails);

/**
 * Check if the current state of a RefCause has a Die.
 * @since 1.18.0
 * @category computed
 */
export const hasDies = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasDies);

/**
 * Check if the current state of a RefCause has an Interrupt.
 * @since 1.18.0
 * @category computed
 */
export const hasInterrupts = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasInterrupts);

/**
 * Check if the current state of a RefCause is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, (self) => self.reasons.length === 0);

/**
 * Get the size (number of failures) of the current state of a RefCause.
 * @since 1.18.0
 * @category computed
 */
export const size = <E, Err, R>(ref: RefCause<E, Err, R>): RefSubject.Computed<number, Err, R> =>
  RefSubject.map(ref, (self) => self.reasons.length);

/**
 * Get the reasons array of the current state of a RefCause.
 * @since 1.18.0
 * @category computed
 */
export const reasons = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<ReadonlyArray<Cause.Reason<E>>, Err, R> =>
  RefSubject.map(ref, (self) => self.reasons);
