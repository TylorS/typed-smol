import type * as Option from "effect/Option"
import * as sinkCore from "../../Sink/combinators.js"
import { make } from "../constructors/make.js"
import type { Fx } from "../Fx.js"

/**
 * Compacts an Fx of Options, discarding `None` values and unwrapping `Some` values.
 *
 * @param self - An `Fx` emitting `Option<A>`.
 * @returns An `Fx` emitting `A`.
 * @since 1.0.0
 * @category combinators
 */
export const compact = <A, E, R>(
  self: Fx<Option.Option<A>, E, R>
): Fx<A, E, R> => make<A, E, R>((sink) => self.run(sinkCore.compact(sink)))
