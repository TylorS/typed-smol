/**
 * Typed constructor for catch handlers used with Matcher.match(route, { catch: RouteCatch(...) }).
 *
 * RouteCatch *requires* a Handler (with optional Deps) or a Layout to extract the error type E from.
 * Fallback Fx type (A, E2, R2) is curried on the second call from the catch callback.
 *
 * RouteCatch(handler)((causeRef) => fallbackFx) — E required from handler
 * RouteCatch(handler, deps)((causeRef) => fallbackFx) — E required from handler | deps
 * RouteCatch(layout)((causeRef) => fallbackFx) — E required from layout's Fx
 * RouteCatch(layout, deps)((causeRef) => fallbackFx) — E required from layout | deps
 */

import type { NoInfer } from "effect/Types";
import type * as Cause from "effect/Cause";
import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import type { Fx } from "@typed/fx/Fx/Fx";
import type { AnyDependency, CatchHandler, DependencyError, LayoutParams } from "@typed/router";

// Infer E from handler return: Fx<_, E, _> | Stream<_, E, _> | Effect<_, E, _>
type HandlerError<H> = H extends (
  ...args: any[]
) =>
  | Fx<any, infer E, any>
  | import("effect/Stream").Stream<any, infer E, any>
  | import("effect/Effect").Effect<any, infer E, any>
  ? E
  : never;

// Infer E from layout's returned Fx (layout: (params) => Fx<_, E, _>)
type LayoutError<L> = L extends (params: any) => Fx<any, infer E, any> ? E : never;

/** RouteCatch(handler)((causeRef) => fallbackFx) — E required from handler */
export function RouteCatch<H>(
  _handler: H,
): <A, E2 = never, R2 = never>(
  catchFn: (causeRef: RefSubject<Cause.Cause<NoInfer<HandlerError<H>>>>) => Fx<A, E2, R2>,
) => CatchHandler<HandlerError<H>, A, E2, R2>;

/** RouteCatch(handler, deps)((causeRef) => fallbackFx) — E required from handler | deps */
export function RouteCatch<H, D extends ReadonlyArray<AnyDependency>>(
  _handler: H,
  _dependencies: D,
): <A, E2 = never, R2 = never>(
  catchFn: (
    causeRef: RefSubject<Cause.Cause<NoInfer<HandlerError<H> | DependencyError<D[number]>>>>,
  ) => Fx<A, E2, R2>,
) => CatchHandler<HandlerError<H> | DependencyError<D[number]>, A, E2, R2>;

/** RouteCatch(layout)((causeRef) => fallbackFx) — E required from layout's Fx */
export function RouteCatch<
  L extends (params: LayoutParams<any, any, any, any>) => Fx<any, any, any>,
>(
  _layout: L,
): <A, E2 = never, R2 = never>(
  catchFn: (causeRef: RefSubject<Cause.Cause<NoInfer<LayoutError<L>>>>) => Fx<A, E2, R2>,
) => CatchHandler<LayoutError<L>, A, E2, R2>;

/** RouteCatch(layout, deps)((causeRef) => fallbackFx) — E required from layout | deps */
export function RouteCatch<
  L extends (params: any) => Fx<any, any, any>,
  D extends ReadonlyArray<AnyDependency>,
>(
  _layout: L,
  _dependencies: D,
): <A, E2 = never, R2 = never>(
  catchFn: (
    causeRef: RefSubject<Cause.Cause<NoInfer<LayoutError<L> | DependencyError<D[number]>>>>,
  ) => Fx<A, E2, R2>,
) => CatchHandler<LayoutError<L> | DependencyError<D[number]>, A, E2, R2>;

export function RouteCatch(
  _handlerOrLayout: ((...args: any[]) => any) | ((params: any) => Fx<any, any, any>),
  _dependencies?: ReadonlyArray<AnyDependency>,
) {
  return (catchFn: CatchHandler<any, any, any, any>): CatchHandler<any, any, any, any> => catchFn;
}
