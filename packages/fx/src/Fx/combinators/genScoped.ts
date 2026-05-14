import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Fx } from "../Fx.js";
import { unwrapScoped } from "./unwrapScoped.js";

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
export const genScoped = <Yield extends Effect.Effect<any, any, any>, A, E, R>(
  f: () => Generator<Yield, Fx<A, E, R>, any>,
): Fx<A, E | Effect.Error<Yield>, Exclude<R | Effect.Services<Yield>, Scope.Scope>> =>
  unwrapScoped(Effect.gen(f)) as any;
