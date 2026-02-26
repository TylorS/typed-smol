/**
 * Typed constructor for route guards used with Matcher.match(route, guard, handler).
 * Curried: RouteGuard(route)((params) => Effect.succeedSome(narrowed)).
 * Handler: (params: Route.Type<Rt>) => Effect<Option<O>, E, R>.
 */

import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type { Route } from "@typed/router";
import { identity } from "effect";

/** RouteGuard(route)((params) => Effect<Option<O>, E, R>) */
export function RouteGuard<Rt extends Route.Any>(
  _route: Rt,
): <O, E = never, R = never>(
  handler: (params: Route.Type<Rt>) => Effect.Effect<Option.Option<O>, E, R>,
) => (params: Route.Type<Rt>) => Effect.Effect<Option.Option<O>, E, R> {
  return identity;
}
