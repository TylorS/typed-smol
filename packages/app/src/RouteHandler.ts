/**
 * Typed constructor for route handlers used with Matcher.match(route, handler).
 * Two overloads: RouteHandler(route)((params) => ...) and RouteHandler(guard)((params) => ...).
 * Handler return: Fx | Stream | Effect | value (MatchHandlerReturnValue).
 */

import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import type { GuardInput, GuardOutput, MatchHandlerReturnValue, Route } from "@typed/router";

/** RouteHandler(route)((params) => ...) — params is RefSubject<Route.Type<Rt>> */
export function RouteHandler<Rt extends Route.Any>(
  _route: Rt,
): <
  E = never,
  R = never,
  O extends MatchHandlerReturnValue<any, E, R> = MatchHandlerReturnValue<any, E, R>,
>(
  handler: (params: RefSubject<Route.Type<Rt>>) => O,
) => (params: RefSubject<Route.Type<Rt>>) => O;

/** RouteHandler(guard)((params) => ...) — params is RefSubject<GuardOutput<G>> */
export function RouteHandler<G extends GuardInput<any, any, any, any>>(
  _guard: G,
): <
  E = never,
  R = never,
  O extends MatchHandlerReturnValue<any, E, R> = MatchHandlerReturnValue<any, E, R>,
>(
  handler: (params: RefSubject<GuardOutput<G>>) => O,
) => (params: RefSubject<GuardOutput<G>>) => O;

export function RouteHandler(_routeOrGuard: Route.Any | GuardInput<any, any, any, any>) {
  return (handler: (params: RefSubject<any>) => any) => handler;
}
