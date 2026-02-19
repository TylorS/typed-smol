import type * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import type { Fx } from "../Fx.js";
import { exit } from "./exit.js";
import { filterMap } from "./filterMap.js";

/**
 * Emits only the failure causes from an Fx, discarding successful values.
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` emitting `Cause<E>`.
 * @since 1.0.0
 * @category combinators
 */
export const causes = <A, E, R>(fx: Fx<A, E, R>): Fx<Cause.Cause<E>, never, R> =>
  filterMap(
    exit(fx),
    Exit.match({
      onFailure: Option.some,
      onSuccess: Option.none,
    }),
  );
