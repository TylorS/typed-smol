import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"
import type { Fx } from "../Fx.js"
import { unwrapScoped } from "./unwrapScoped.js"

/** Extract error type from Yieldable (Effect v4) */
type _YE<Y> = Y extends Effect.Yieldable<any, any, infer E, any> ? E : never
/** Extract services type from Yieldable (Effect v4) */
type _YS<Y> = Y extends Effect.Yieldable<any, any, any, infer R> ? R : never

/**
 * Creates a scoped Fx using a generator function.
 *
 * Similar to `gen`, but also handles resource management via Scope.
 *
 * @param f - The generator function.
 * @returns An `Fx` representing the result of the generator.
 * @since 1.0.0
 * @category combinators
 */
export const genScoped = <Yield extends Effect.Yieldable<any, any, any, any>, A, E, R>(
  f: () => Generator<Yield, Fx<A, E, R>, any>
): Fx<A, E | _YE<Yield>, Exclude<R | _YS<Yield>, Scope.Scope>> =>
  unwrapScoped(Effect.gen(f)) as any
