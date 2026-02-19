import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Maps and filters elements of an Fx in a single operation.
 *
 * @param f - A function that returns an `Option` for each element.
 * @returns An `Fx` that emits values for which `f` returns `Some`.
 * @since 1.0.0
 * @category combinators
 */
export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <E, R>(self: Fx<A, E, R>) => Fx<B, E, R>;

  <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R>;
} = dual(
  2,
  <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R> =>
    make<B, E, R>((sink) => self.run(sinkCore.filterMap(sink, f))),
);
