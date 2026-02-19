import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { unwrap } from "./unwrap.js";

/** Extract error type from Yieldable (Effect v4) */
type _YE<Y> = Y extends Effect.Yieldable<any, any, infer E, any> ? E : never;
/** Extract services type from Yieldable (Effect v4) */
type _YS<Y> = Y extends Effect.Yieldable<any, any, any, infer R> ? R : never;

/**
 * Creates an Fx using a generator function (Effect.gen style).
 *
 * This allows writing Fx code in a synchronous-looking style, using `yield*` to composition.
 * Note: The generator yields Effects, and the result is an Fx.
 *
 * @param f - The generator function.
 * @returns An `Fx` representing the result of the generator.
 * @since 1.0.0
 * @category combinators
 */
export const gen = <Yield extends Effect.Yieldable<any, any, any, any>, Return extends Fx.Any>(
  f: () => Generator<Yield, Return, any>,
): Fx<Fx.Success<Return>, Fx.Error<Return> | _YE<Yield>, Fx.Services<Return> | _YS<Yield>> =>
  unwrap(Effect.gen(f)) as any;
