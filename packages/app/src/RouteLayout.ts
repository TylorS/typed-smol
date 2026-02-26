/**
 * Typed constructor for layout used with Matcher.match(route, { layout }).
 * Handler has same shape as RouteHandler: (params: from-route-or-guard) => HandlerReturn.
 * Params come from route (RefSubject<Route.Type<Rt>>) or guard (RefSubject<GuardOutput<G>>).
 * Returns the layout (handler wrapped to Fx). Not self-referential: handler is the implementation.
 *
 * RouteLayout(route, handler, dependencies?)
 * RouteLayout(guard, handler, dependencies?)
 */

import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { fromEffect } from "@typed/fx/Fx/constructors/fromEffect";
import { succeed } from "@typed/fx/Fx/constructors/succeed";
import { fromStream } from "@typed/fx/Fx/stream";
import type { Fx } from "@typed/fx/Fx/Fx";
import { isFx } from "@typed/fx/Fx/TypeId";
import type {
  AnyDependency,
  DependencyError,
  DependencyProvided,
  DependencyRequirements,
  GuardInput,
  GuardOutput,
  LayoutParams,
  MatchHandlerReturnValue,
  Route,
} from "@typed/router";

type ApplyDependencies<E, R, D> =
  D extends ReadonlyArray<any>
    ? {
        readonly e: E | DependencyError<D[number]>;
        readonly r: Exclude<R, DependencyProvided<D[number]>> | DependencyRequirements<D[number]>;
      }
    : { readonly e: E; readonly r: R };

function toFx<A, E, R>(
  value: Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A,
): Fx<A, E, R> {
  if (isFx(value)) return value as Fx<A, E, R>;
  if (Stream.isStream(value)) return fromStream(value) as Fx<A, E, R>;
  if (Effect.isEffect(value)) return fromEffect(value) as Fx<A, E, R>;
  return succeed(value) as Fx<A, E, R>;
}

/** RouteLayout(route, handler) — params from route (RefSubject<Route.Type<Rt>>); handler return: Fx | Stream | Effect | value */
export function RouteLayout<Rt extends Route.Any, B, E2 = never, R2 = never>(
  _route: Rt,
  handler: (params: RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>,
): <C, E3, R3>(params: LayoutParams<Route.Type<Rt>, B, E2, R2>) => Fx<C, E3, R3>;

/** RouteLayout(route, handler, deps) — params from route; content E/R adjusted by deps */
export function RouteLayout<
  Rt extends Route.Any,
  B,
  E = never,
  R = never,
  D extends ReadonlyArray<AnyDependency> = [],
>(
  _route: Rt,
  handler: (params: RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E, R>,
  _dependencies: D,
): <C, E3, R3>(
  params: LayoutParams<
    Route.Type<Rt>,
    B,
    ApplyDependencies<E, R, D>["e"],
    ApplyDependencies<E, R, D>["r"]
  >,
) => Fx<C, E3, R3>;

/** RouteLayout(guard, handler) — params from guard (RefSubject<GuardOutput<G>>); handler return: Fx | Stream | Effect | value */
export function RouteLayout<G extends GuardInput<any, any, any, any>, B, E2 = never, R2 = never>(
  _guard: G,
  handler: (params: RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<B, E2, R2>,
): <C, E3, R3>(params: LayoutParams<GuardOutput<G>, B, E2, R2>) => Fx<C, E3, R3>;

/** RouteLayout(guard, handler, deps) — params from guard; content E/R adjusted by deps */
export function RouteLayout<
  G extends GuardInput<any, any, any, any>,
  A,
  E,
  R,
  D extends ReadonlyArray<AnyDependency> = [],
>(
  _guard: G,
  handler: (params: RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<A, E, R>,
  _dependencies: D,
): <C, E3, R3>(
  params: LayoutParams<
    GuardOutput<G>,
    A,
    ApplyDependencies<E, R, D>["e"],
    ApplyDependencies<E, R, D>["r"]
  >,
) => Fx<C, E3, R3>;

export function RouteLayout(
  _routeOrGuard: Route.Any | GuardInput<any, any, any, any>,
  handler: (params: RefSubject<any>) => MatchHandlerReturnValue<any, any, any>,
  _dependencies?: ReadonlyArray<AnyDependency>,
) {
  return (layoutParams: LayoutParams<any, any, any, any>) => toFx(handler(layoutParams.params));
}
