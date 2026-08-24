import * as findMyWay from "find-my-way-ts";
import type * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual, identity } from "effect/Function";
import * as Result from "effect/Result";
import * as Layer from "effect/Layer";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as Stream from "effect/Stream";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";
import { mapEffect } from "@typed/fx/Fx/combinators/mapEffect";
import { skipRepeats } from "@typed/fx/Fx/combinators/skipRepeats";
import { switchMap } from "@typed/fx/Fx/combinators/switchMap";
import { unwrap } from "@typed/fx/Fx/combinators/unwrap";
import { make as makeFx } from "@typed/fx/Fx";
import { fromEffect } from "@typed/fx/Fx/constructors/fromEffect";
import { succeed } from "@typed/fx/Fx/constructors/succeed";
import type * as Fx from "@typed/fx/Fx/Fx";
import { fromStream } from "@typed/fx/Fx/stream";
import { FxTypeId, isFx } from "@typed/fx/Fx/TypeId";
import { RefSubject } from "@typed/fx/RefSubject";
import { getGuard } from "@typed/guard";
import type { AsGuard, Guard as GuardType, GuardInput } from "@typed/guard";
import { CurrentPath, Navigation } from "@typed/navigation/Navigation";
import type { MatchAst, RouteAst } from "./AST.js";
import * as AST from "./AST.js";
import { CurrentRoute } from "./CurrentRoute.js";
import * as Path from "./Path.js";
import { Join, make as makeRoute, type Route } from "./Route.js";
import {
  makeCatchManager,
  makeLayerManager,
  makeLayoutManager,
  makeRouteExecutor,
  RouteDecodeError,
  RouteGuardError,
  RouteNotFound,
} from "./RouteExecutor.js";
import type { Router } from "./Router.js";
import { Sink } from "@typed/fx";

export type Layout<Params, A, E, R, B, E2, R2> = (
  params: LayoutParams<Params, A, E, R>,
) => Fx.Fx<B, E2, R2>;

export type LayoutParams<Params, A, E, R> = {
  readonly params: RefSubject.RefSubject<Params>;
  readonly content: Fx.Fx<A, E, R>;
};

export type CatchHandler<E, A, E2, R2> = (
  cause: RefSubject.RefSubject<Cause.Cause<E>>,
) => Fx.Fx<A, E2, R2>;

export type AnyLayer =
  | Layer.Layer<any, any, any>
  | Layer.Layer<never, any, any>
  | Layer.Layer<any, never, any>
  | Layer.Layer<any, any, never>
  | Layer.Layer<never, never, never>
  | Layer.Layer<any, never, never>
  | Layer.Layer<never, any, never>
  | Layer.Layer<never, never, any>;

export type AnyServiceMap = Context.Context<any> | Context.Context<never>;
export type AnyDependency = AnyLayer | AnyServiceMap;
/** @internal */
export type AnyLayout = Layout<any, any, any, any, any, any, any>;
/** @internal */
export type AnyCatch = CatchHandler<any, any, any, any>;
type AnyGuard = GuardType<any, any, any, any>;
type AnyMatchHandler = (params: RefSubject.RefSubject<any>) => Fx.Fx<any, any, any>;

export type DependencyProvided<D> =
  D extends Layer.Layer<infer Provided, any, any>
    ? Provided
    : D extends Context.Context<infer Provided>
      ? Provided
      : never;
export type DependencyError<D> = D extends Layer.Layer<any, infer E, any> ? E : never;
export type DependencyRequirements<D> = D extends Layer.Layer<any, any, infer R> ? R : never;

type LayerSuccess<L> = L extends Layer.Layer<infer Provided, any, any> ? Provided : never;
type LayerError<L> = L extends Layer.Layer<any, infer E, any> ? E : never;
type LayerServices<L> = L extends Layer.Layer<any, any, infer R> ? R : never;

export type { AsGuard, GuardInput, GuardType };

export type GuardOutput<G> = GuardType.Output<G>;
export type GuardError<G> = GuardType.Error<G>;
export type GuardServices<G> = GuardType.Services<G>;

type MatchOptions<Rt extends Route.Any, B, E2, R2, D, LB, LE2, LR2, C> = {
  readonly route: Rt;
  readonly handler:
    | MatchHandlerReturnValue<B, E2, R2>
    | ((params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>);
  readonly dependencies?: D;
  readonly layout?: Layout<Route.Type<Rt>, B, E2, R2, LB, LE2, LR2>;
  readonly catch?: C;
};

export type MatchHandlerReturnValue<A, E, R> =
  | Fx.Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A;

type MatchHandlerOptions<Params, B, E2, R2, D, LB, LE2, LR2, C> = {
  readonly handler:
    | MatchHandlerReturnValue<B, E2, R2>
    | ((params: RefSubject.RefSubject<Params>) => MatchHandlerReturnValue<B, E2, R2>);
  readonly dependencies?: D;
  readonly layout?: Layout<Params, B, E2, R2, LB, LE2, LR2>;
  readonly catch?: C;
};

type ApplyDependencies<E, R, D> =
  D extends ReadonlyArray<infer Dep>
    ? {
        readonly e: E | DependencyError<Dep>;
        readonly r: Exclude<R, DependencyProvided<Dep>> | DependencyRequirements<Dep>;
      }
    : { readonly e: E; readonly r: R };

type ApplyCatch<A, E, R, C> =
  C extends CatchHandler<any, infer CA, infer CE, infer CR>
    ? { readonly a: A | CA; readonly e: CE; readonly r: R | CR }
    : { readonly a: A; readonly e: E; readonly r: R };

type ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GE, GR> = ApplyCatch<
  LB,
  ApplyDependencies<E2 | GE | LE2, R2 | GR | LR2, D>["e"],
  ApplyDependencies<E2 | GE | LE2, R2 | GR | LR2, D>["r"],
  C
>;

export interface Matcher<A, E = never, R = never>
  extends
    Fx.Fx<A, E | RouteNotFound | RouteDecodeError | RouteGuardError, R | Router | Scope.Scope>,
    Pipeable {
  readonly cases: ReadonlyArray<MatchAst>;

  // Overload 1: match(route, handler) - function handler (must be first for inference)
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: (params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;

  // Overload 2: match(route, effectLike) - Fx/Effect/Stream handler
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;

  // Overload 3: match(route, options) - route with options object
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    options: MatchHandlerOptions<Route.Type<Rt>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;

  // Overload 4: match(route, value) - direct value handler (last for 2-arg form)
  match<Rt extends Route.Any, const B>(route: Rt, handler: B): Matcher<A | B, E, R | Scope.Scope>;

  // Overload 5: match(route, guard, handler) - guard with function handler (must be before value)
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
  >(
    route: Rt,
    guard: G,
    handler: (params: RefSubject.RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;

  // Overload 6: match(route, guard, effectLike) - guard with Fx/Effect/Stream handler
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
  >(
    route: Rt,
    guard: G,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;

  // Overload 7: match(route, guard, options) - route with guard and options object
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    guard: G,
    options: MatchHandlerOptions<GuardOutput<G>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["e"],
    | R
    | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["r"]
    | Scope.Scope
  >;

  // Overload 8: match(route, guard, value) - guard with value handler (last for 3-arg form)
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B>(
    route: Rt,
    guard: G,
    handler: B,
  ): Matcher<A | B, E | GuardError<G>, R | GuardServices<G> | Scope.Scope>;

  // Overload 9: match(fullOptions) - full options object including route
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    options: MatchOptions<Rt, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;

  readonly prefix: <Rt extends Route.Any>(route: Rt) => Matcher<A, E, R>;

  readonly provide: <Layers extends readonly [AnyLayer, ...AnyLayer[]]>(
    ...layers: Layers
  ) => Matcher<
    A,
    E | LayerError<Layers[number]>,
    Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
  >;

  readonly provideService: <Id, S>(
    tag: Context.Service<Id, S>,
    service: S,
  ) => Matcher<A, E, Exclude<R, Id>>;

  readonly provideContext: <R2>(services: Context.Context<R2>) => Matcher<A, E, Exclude<R, R2>>;

  readonly catchCause: <B, E2, R2>(f: CatchHandler<E, B, E2, R2>) => Matcher<A | B, E2, R | R2>;

  readonly catch: <B, E2, R2>(f: (e: E) => Fx.Fx<B, E2, R2>) => Matcher<A | B, E2, R | R2>;

  readonly catchTag: <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, B, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ) => Matcher<
    A | B,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  readonly layout: <B, E2, R2>(
    layout: Layout<any, A, E, R, B, E2, R2>,
  ) => Matcher<B, E | E2, R | R2>;

  /** Merge this matcher with one or more others. Combined matcher matches all routes; each matcher's layouts/provide apply only to its own routes. */
  readonly merge: <const Others extends ReadonlyArray<Matcher.Any>>(
    ...others: Others
  ) => Matcher<
    A | Matcher.MergeSuccess<Others>,
    E | Matcher.MergeError<Others>,
    R | Matcher.MergeServices<Others>
  >;
}

export declare namespace Matcher {
  export type Any =
    | Matcher<any, any, any>
    | Matcher<any, never, any>
    | Matcher<any, any, never>
    | Matcher<any, never, never>;
  export type Success<T> = [T] extends [Matcher<infer A, infer _E, infer _R>] ? A : never;
  export type Error<T> = [T] extends [Matcher<infer _A, infer E, infer _R>] ? E : never;
  export type Services<T> = [T] extends [Matcher<infer _A, infer _E, infer R>] ? R : never;

  /** Union of Success types from each matcher in a tuple. */
  export type MergeSuccess<Matchers extends ReadonlyArray<Matcher.Any>> = Success<Matchers[number]>;
  /** Union of Error types from each matcher in a tuple. */
  export type MergeError<Matchers extends ReadonlyArray<Matcher.Any>> = Error<Matchers[number]>;
  /** Union of Services types from each matcher in a tuple. */
  export type MergeServices<Matchers extends ReadonlyArray<Matcher.Any>> = Services<
    Matchers[number]
  >;
}

export type MatchHandler<Params, A, E, R> =
  | Fx.Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A
  | ((
      params: RefSubject.RefSubject<Params>,
    ) => Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A);

type MatchHandlerFn<Params, A, E, R> = (
  params: RefSubject.RefSubject<Params>,
) => Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A;

function isMatchHandlerFn<Params, A, E, R>(
  handler: MatchHandler<Params, A, E, R>,
): handler is MatchHandlerFn<Params, A, E, R> {
  return typeof handler === "function";
}

function isHandlerOptions(value: unknown): value is { readonly handler: unknown } {
  return typeof value === "object" && value !== null && "handler" in value;
}

// Monomorphic shape - all properties always present for V8 optimization
type ParsedMatch = {
  readonly route: Route.Any;
  readonly handler: unknown;
  readonly guard: AnyGuard | undefined;
  readonly layout: AnyLayout | undefined;
  readonly catchFn: AnyCatch | undefined;
  readonly dependencies: ReadonlyArray<AnyDependency> | undefined;
};

function parseMatchArgs(args: [unknown, ...Array<unknown>]): ParsedMatch {
  const [first, second, third] = args;

  // Single arg: full options object (Overload 9)
  if (second === undefined) {
    const opts = first as MatchOptions<Route.Any, any, any, any, any, any, any, any, any>;
    return {
      route: opts.route,
      handler: opts.handler,
      guard: undefined,
      layout: opts.layout as AnyLayout | undefined,
      catchFn: opts.catch as AnyCatch | undefined,
      dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
    };
  }

  // Two args
  if (third === undefined) {
    if (isHandlerOptions(second)) {
      // Overload 3: match(route, options)
      const opts = second as MatchHandlerOptions<any, any, any, any, any, any, any, any, any>;
      return {
        route: first as Route.Any,
        handler: opts.handler,
        guard: undefined,
        layout: opts.layout as AnyLayout | undefined,
        catchFn: opts.catch as AnyCatch | undefined,
        dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
      };
    }
    // Overloads 1, 2, 4: match(route, handler)
    return {
      route: first as Route.Any,
      handler: second,
      guard: undefined,
      layout: undefined,
      catchFn: undefined,
      dependencies: undefined,
    };
  }

  // Three args
  if (isHandlerOptions(third)) {
    // Overload 7: match(route, guard, options)
    const opts = third as MatchHandlerOptions<any, any, any, any, any, any, any, any, any>;
    return {
      route: first as Route.Any,
      handler: opts.handler,
      guard: second as AnyGuard,
      layout: opts.layout as AnyLayout | undefined,
      catchFn: opts.catch as AnyCatch | undefined,
      dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
    };
  }

  // Overloads 5, 6, 8: match(route, guard, handler)
  return {
    route: first as Route.Any,
    handler: third,
    guard: second as AnyGuard,
    layout: undefined,
    catchFn: undefined,
    dependencies: undefined,
  };
}

class MatcherImpl<A, E, R> implements Matcher<A, E, R> {
  readonly [FxTypeId]: Fx.Fx.Variance<
    A,
    E | RouteNotFound | RouteDecodeError | RouteGuardError,
    R | Scope.Scope | Router
  > = {
    _A: identity,
    _E: identity,
    _R: identity,
  };
  readonly cases: ReadonlyArray<MatchAst>;
  constructor(cases: ReadonlyArray<MatchAst>) {
    this.cases = cases;
    this.match = this.match.bind(this);
    this.catch = this.catch.bind(this);
    this.catchTag = this.catchTag.bind(this);
    this.layout = this.layout.bind(this);
    this.provide = this.provide.bind(this);
    this.provideService = this.provideService.bind(this);
  }

  // Implementation overloads for type inference - use simplified return types
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: (params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    options: MatchHandlerOptions<Route.Type<Rt>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;
  match<Rt extends Route.Any, B>(route: Rt, handler: B): Matcher<A | B, E, R | Scope.Scope>;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B, E2, R2>(
    route: Rt,
    guard: G,
    handler: (params: RefSubject.RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B, E2, R2>(
    route: Rt,
    guard: G,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    guard: G,
    options: MatchHandlerOptions<GuardOutput<G>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["e"],
    | R
    | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["r"]
    | Scope.Scope
  >;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B>(
    route: Rt,
    guard: G,
    handler: B,
  ): Matcher<A | B, E | GuardError<G>, R | GuardServices<G> | Scope.Scope>;
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    options: MatchOptions<Rt, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;
  match(...args: [unknown, ...Array<unknown>]): Matcher<any, any, any> {
    const parsed = parseMatchArgs(args);
    const normalizedGuard =
      parsed.guard !== undefined
        ? getGuard(parsed.guard as GuardInput<any, any, any, any>)
        : defaultGuard();

    const routeAst = AST.route(
      parsed.route.ast,
      parsed.handler as MatchHandler<any, any, any, any>,
      normalizedGuard,
    );

    let matches: ReadonlyArray<MatchAst> = [routeAst];
    if (parsed.layout !== undefined) {
      matches = [AST.layout(matches, parsed.layout)];
    }
    if (parsed.catchFn !== undefined) {
      matches = [AST.catchCause(matches, parsed.catchFn)];
    }
    if (parsed.dependencies !== undefined && parsed.dependencies.length > 0) {
      matches = [AST.layer(matches, normalizeDependencies(parsed.dependencies))];
    }

    return new MatcherImpl([...this.cases, ...matches]);
  }

  prefix<Rt extends Route.Any>(route: Rt): Matcher<A, E, R> {
    return new MatcherImpl<A, E, R>([AST.prefixed(this.cases, route.ast)]);
  }

  provide<Layers extends readonly [AnyLayer, ...AnyLayer[]]>(
    ...layers: Layers
  ): Matcher<
    A,
    E | LayerError<Layers[number]>,
    Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
  > {
    return new MatcherImpl([AST.layer(this.cases, layers)]) as Matcher<
      A,
      E | LayerError<Layers[number]>,
      Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
    >;
  }

  provideService<Id, S>(tag: Context.Service<Id, S>, service: S): Matcher<A, E, Exclude<R, Id>> {
    return this.provideContext(Context.make(tag, service));
  }

  provideContext<R2>(services: Context.Context<R2>): Matcher<A, E, Exclude<R, R2>> {
    return this.provide(Layer.succeedContext(services));
  }

  catchCause<B, E2, R2>(f: CatchHandler<E, B, E2, R2>): Matcher<A | B, E2, R | R2> {
    return new MatcherImpl<A | B, E2, R | R2>([AST.catchCause(this.cases, f as AnyCatch)]);
  }

  catch<B, E2, R2>(f: (e: E) => Fx.Fx<B, E2, R2>): Matcher<A | B, E2, R | R2> {
    return this.catchCause((causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          return f(result.success.error);
        }),
      ),
    );
  }

  catchTag<const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, B, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ): Matcher<
    A | B,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > {
    const rethrow = (cause: Cause.Cause<E>) =>
      fromEffect(Effect.failCause(cause)) as Fx.Fx<
        B,
        E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
        R2
      >;

    return new MatcherImpl<
      A | B,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >([
      AST.catchCause(this.cases, (causeRef) =>
        unwrap(
          Effect.gen(function* () {
            const cause = yield* causeRef;
            const result = Cause.findFail(cause);
            if (Result.isFailure(result)) {
              return rethrow(cause);
            }
            if (matchesTag(tag, result.success.error)) {
              return f(result.success.error);
            }
            return rethrow(cause);
          }),
        ),
      ),
    ]);
  }

  layout<B, E2, R2>(layout: Layout<any, A, E, R, B, E2, R2>): Matcher<B, E | E2, R | R2> {
    return new MatcherImpl<B, E | E2, R | R2>([
      AST.layout(this.cases, layout as AnyLayout),
    ]) as Matcher<B, E | E2, R | R2>;
  }

  merge<const Others extends ReadonlyArray<Matcher.Any>>(
    ...others: Others
  ): Matcher<
    A | Matcher.MergeSuccess<Others>,
    E | Matcher.MergeError<Others>,
    R | Matcher.MergeServices<Others>
  > {
    const allCases = [...this.cases, ...others.flatMap((m) => m.cases)];
    return new MatcherImpl(allCases) as Matcher<
      A | Matcher.MergeSuccess<Others>,
      E | Matcher.MergeError<Others>,
      R | Matcher.MergeServices<Others>
    >;
  }

  pipe() {
    return pipeArguments(this, arguments);
  }

  run<RSink>(sink: Sink.Sink<A, E | RouteNotFound | RouteDecodeError | RouteGuardError, RSink>) {
    return Effect.gen({ self: this }, function* () {
      const current = yield* CurrentRoute;
      const prefixed = this.prefix(current.route);
      const entries = yield* Effect.try({
        try: () => compile(prefixed.cases),
        catch: (error) =>
          new RouteDecodeError({
            path: current.route.path,
            cause: error instanceof Error ? error.message : String(error),
          }),
      });
      const executor = yield* makeRouteExecutor<A, E, R>();
      const router = findMyWay.make<ReadonlyArray<CompiledEntry>>({
        ignoreTrailingSlash: true,
        caseSensitive: false,
      });
      const handlersByPath = new Map<string, Array<CompiledEntry>>();
      for (const entry of entries) {
        for (const path of getMatcherPaths(entry.route.ast)) {
          const existing = handlersByPath.get(path);
          if (existing !== undefined) {
            existing.push(entry);
          } else {
            const list: Array<CompiledEntry> = [entry];
            handlersByPath.set(path, list);
            yield* Effect.try({
              try: () => router.on("GET", path, list),
              catch: (error) =>
                new RouteDecodeError({
                  path,
                  cause: error instanceof Error ? error.message : String(error),
                }),
            });
          }
        }
      }

      const stream = CurrentPath.pipe(
        mapEffect(
          Effect.fn(function* (path) {
            const result = router.find("GET", path);
            if (result === undefined) return yield* new RouteNotFound({ path });
            return yield* executor.transition({
              path,
              input: { ...result.searchParams, ...result.params },
              candidates: result.handler,
            });
          }),
        ),
        skipRepeats,
        switchMap(identity),
      );

      return yield* stream.run(sink);
    }).pipe(Effect.catchCause((cause) => sink.onFailure(cause)));
  }
}

function normalizeHandler<Params, B, E2 = never, R2 = never>(
  handler: MatchHandler<Params, B, E2, R2>,
): (params: RefSubject.RefSubject<Params>) => Fx.Fx<B, E2, R2> {
  if (isMatchHandlerFn(handler)) return (params) => toFx(handler(params));
  return () => toFx(handler);
}

function toFx<A, E, R>(
  value: Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A,
): Fx.Fx<A, E, R> {
  if (isFx(value)) return value;
  if (Stream.isStream(value)) return fromStream(value);
  if (Effect.isEffect(value)) return fromEffect(value);
  return succeed(value);
}

export const empty: Matcher<never> = new MatcherImpl([]);
export const match = empty.match.bind(empty);

/**
 * Merge multiple matchers into one. Each matcher's layouts and provide apply only to its own routes.
 * Use this so directory layouts (e.g. api/_layout) and directory dependencies apply only to routes under that directory.
 */
export function merge<const Matchers extends ReadonlyArray<Matcher.Any>>(
  ...matchers: Matchers
): Matcher<
  Matcher.MergeSuccess<Matchers>,
  Matcher.MergeError<Matchers>,
  Matcher.MergeServices<Matchers>
> {
  if (matchers.length === 0) {
    return empty as unknown as Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >;
  }
  if (matchers.length === 1) {
    return matchers[0] as unknown as Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >;
  }
  const first = matchers[0] as MatcherImpl<
    Matcher.MergeSuccess<Matchers>,
    Matcher.MergeError<Matchers>,
    Matcher.MergeServices<Matchers>
  >;
  const rest = matchers.slice(1) as ReadonlyArray<
    Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >
  >;
  return first.merge(...rest) as unknown as Matcher<
    Matcher.MergeSuccess<Matchers>,
    Matcher.MergeError<Matchers>,
    Matcher.MergeServices<Matchers>
  >;
}

export { RouteDecodeError, RouteGuardError, RouteNotFound } from "./RouteExecutor.js";

/**
 * @internal
 */
export type CompiledEntry = {
  readonly route: Route.Any;
  readonly guard: AnyGuard;
  readonly handler: AnyMatchHandler;
  readonly layers: ReadonlyArray<AnyLayer>;
  readonly layouts: ReadonlyArray<AnyLayout>;
  readonly catches: ReadonlyArray<AnyCatch>;
  readonly decode: (input: unknown) => Effect.Effect<any, Schema.SchemaError, any>;
};

type InputSucces<T> = [Matcher.Success<T> | Fx.Fx.Success<T>] extends [infer A] ? A : never;
type InputError<T> = [Matcher.Error<T> | Fx.Fx.Error<T>] extends [infer E] ? E : never;
type InputServices<T> = [Matcher.Services<T> | Fx.Fx.Services<T>] extends [infer R] ? R : never;

export const catchCause: {
  <I extends Fx.Fx.Any | Matcher.Any, B, E2 = never, R2 = never>(
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): (input: I) => Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;

  <I extends Fx.Fx.Any | Matcher.Any, B, E2 = never, R2 = never>(
    input: I,
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(
    input: Fx.Fx<A, E, R> | Matcher<A, E, R>,
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<E | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<A | B, E2, R | R2 | Router | Scope.Scope> => {
    const eff = Effect.gen(function* () {
      const fiberId = yield* Effect.fiberId;
      const rootScope = yield* Effect.scope;
      const manager = makeCatchManager(rootScope, fiberId);
      const result = yield* manager.apply([f], input, Context.empty() as Context.Context<any>);
      return result as Fx.Fx<A | B, E2, R | R2 | Router | Scope.Scope>;
    });
    return unwrap(eff);
  },
);

export const catch_: {
  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): (input: I) => Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;

  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    input: I,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;
} = dual(
  2,
  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    input: I,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope> =>
    catchCause(input, (causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          return f(result.success.error as InputError<I>);
        }),
      ),
    ),
);

export { catch_ as catch };

export const catchTag: {
  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    k: K,
    f: (
      e: ExtractTag<
        NoInfer<InputError<I>>,
        K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): (
    input: I,
  ) => Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  >;

  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    input: I,
    k: K,
    f: (
      e: ExtractTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  >;
} = dual(
  3,
  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    input: I,
    k: K,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  > => {
    type RemainingError = ExcludeTag<
      InputError<I>,
      K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
    >;
    const rethrow = (
      cause: Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>,
    ) =>
      fromEffect(Effect.failCause(cause as Cause.Cause<RemainingError>)) as Fx.Fx<
        B,
        E2 | RemainingError,
        R2
      >;

    return catchCause(input, (causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          if (matchesTag(k, result.success.error)) {
            return f(
              result.success.error as ExtractTag<
                InputError<I>,
                K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
              >,
            );
          }
          return rethrow(cause);
        }),
      ),
    );
  },
);

export const redirectTo =
  (path: string) =>
  <I extends Fx.Fx.Any | Matcher.Any>(
    input: I,
  ): Fx.Fx<
    InputSucces<I>,
    Exclude<InputError<I>, RouteNotFound>,
    Router | Scope.Scope | InputServices<I>
  > =>
    makeFx<
      InputSucces<I>,
      Exclude<InputError<I>, RouteNotFound>,
      Router | Scope.Scope | InputServices<I>
    >((sink) =>
      Effect.gen(function* () {
        let redirected = false;
        const runOnce = (target: typeof sink) =>
          input.run(
            Sink.make(
              (cause) =>
                Effect.gen(function* () {
                  if (redirected) return yield* target.onFailure(cause as Cause.Cause<any>);
                  const failure = Cause.findFail(cause);
                  if (
                    Result.isFailure(failure) ||
                    failure.success.error._tag !== "RouteNotFound"
                  ) {
                    return yield* target.onFailure(cause as Cause.Cause<any>);
                  }
                  redirected = true;
                  yield* Navigation.navigate(path).pipe(
                    Effect.catchCause((navCause) =>
                      target.onFailure(navCause as Cause.Cause<any>),
                    ),
                  );
                  return yield* input.run(target as any);
                }) as Effect.Effect<unknown, never, any>,
              (value) => target.onSuccess(value),
            ),
          );
        return yield* runOnce(sink);
      }),
    );

const hasTag = (u: unknown): u is { readonly _tag: string } =>
  typeof u === "object" &&
  u !== null &&
  "_tag" in u &&
  typeof (u as Record<string, unknown>)["_tag"] === "string";

const matchesTag = <E, K extends string>(
  tag: K | Arr.NonEmptyReadonlyArray<K>,
  error: E,
): error is ExtractTag<E, K> => {
  if (!hasTag(error)) return false;
  if (typeof tag === "string") return error._tag === tag;
  return tag.some((t) => t === error._tag);
};

function isServiceMap(dep: AnyDependency): dep is AnyServiceMap {
  return !Layer.isLayer(dep);
}

function toSingleLayer(dep: AnyDependency): AnyLayer {
  if (isServiceMap(dep)) return Layer.succeedContext(dep);
  return dep;
}

function normalizeDependencies(
  dependencies: ReadonlyArray<AnyDependency>,
): ReadonlyArray<AnyLayer> {
  return dependencies.map(toSingleLayer);
}

type NormalizeLayer<T extends AnyDependency> =
  T extends Layer.Layer<infer A, infer E, infer R>
    ? Layer.Layer<A, E, R>
    : T extends Context.Context<infer R>
      ? Layer.Layer<R>
      : never;

type NormalizeLayers<T extends ReadonlyArray<AnyDependency>> = {
  [K in keyof T]: NormalizeLayer<T[K]>;
};

type ToLayer<T> =
  T extends ReadonlyArray<AnyLayer>
    ? Layer.Layer<Layer.Success<T[number]>, Layer.Error<T[number]>, Layer.Services<T[number]>>
    : never;

type NormalizeDeps<T extends AnyDependency | ReadonlyArray<AnyDependency>> = T extends AnyDependency
  ? NormalizeLayer<T>
  : T extends ReadonlyArray<AnyDependency>
    ? ToLayer<NormalizeLayers<T>>
    : never;

/**
 * Normalize dependency input (ServiceMap | Layer | Array of either) into a single Layer.
 * Use with `.provide(normalizeDependencyInput(deps))`.
 */
export function normalizeDependencyInput<Deps extends AnyDependency | ReadonlyArray<AnyDependency>>(
  input: Deps,
): NormalizeDeps<Deps> {
  const arr = Array.isArray(input) ? input : [input];
  const layers = normalizeDependencies(arr as AnyDependency[]);
  return mergeLayers(layers) as NormalizeDeps<Deps>;
}

function defaultGuard<A>(): GuardType<A, A> {
  return Effect.succeedSome;
}

function mergeLayers(layers: ReadonlyArray<AnyLayer>): AnyLayer {
  if (layers.length === 0) return Layer.empty;
  if (layers.length === 1) return layers[0];
  let current = layers[0];
  for (let i = 1; i < layers.length; i++) {
    current = Layer.merge(current, layers[i]);
  }
  return current;
}

/**
 * @internal
 */
export function compile(cases: ReadonlyArray<MatchAst>): ReadonlyArray<CompiledEntry> {
  const entries: Array<CompiledEntry> = [];

  const visit = (
    matches: ReadonlyArray<MatchAst>,
    context: {
      readonly layers: ReadonlyArray<AnyLayer>;
      readonly layouts: ReadonlyArray<AnyLayout>;
      readonly catches: ReadonlyArray<AnyCatch>;
      readonly prefixes: ReadonlyArray<RouteAst>;
    },
  ): void => {
    for (const match of matches) {
      switch (match.type) {
        case "route": {
          const baseRoute = makeRoute(match.route);
          const prefixedRoute = applyPrefixes(baseRoute, context.prefixes);
          const guard = getGuard(match.guard as GuardInput<any, any, any, any>);
          const handler = normalizeHandler(match.handler);
          const decode = makeRouteDecoder(prefixedRoute);
          entries.push({
            route: prefixedRoute,
            guard,
            handler,
            layers: context.layers,
            layouts: context.layouts,
            catches: context.catches,
            decode,
          });
          break;
        }
        case "layer": {
          const merged = mergeLayers(match.deps);
          visit(match.matches, {
            ...context,
            layers: [...context.layers, merged],
          });
          break;
        }
        case "layout": {
          visit(match.matches, {
            ...context,
            layouts: [...context.layouts, match.layout as AnyLayout],
          });
          break;
        }
        case "prefixed": {
          visit(match.matches, {
            ...context,
            prefixes: [...context.prefixes, match.prefix],
          });
          break;
        }
        case "catch": {
          visit(match.matches, {
            ...context,
            catches: [...context.catches, match.f as AnyCatch],
          });
          break;
        }
      }
    }
  };

  visit(cases, { layers: [], layouts: [], catches: [], prefixes: [] });
  return entries;
}

function getMatcherPaths(ast: RouteAst): ReadonlyArray<findMyWay.PathInput> {
  let variants: Array<Array<AST.PathAst>> = [[]];
  for (const part of Path.flattenRouteAst(ast)) {
    if (part.type === "query-params") continue;
    if (part.type === "parameter" && part.optional) {
      const required = AST.parameter(part.name, undefined, part.regex);
      variants = variants.flatMap((variant) => [[...variant, required], variant]);
    } else {
      variants = variants.map((variant) => [...variant, part]);
    }
  }

  return [...new Set(variants.map(formatMatcherPath))];
}

function formatMatcherPath(parts: ReadonlyArray<AST.PathAst>): findMyWay.PathInput {
  const normalized: Array<AST.PathAst> = [];
  for (const part of parts) {
    if (part.type === "slash" && normalized.at(-1)?.type === "slash") continue;
    normalized.push(part);
  }
  if (normalized.at(-1)?.type === "slash") normalized.pop();
  return Path.join(normalized);
}

function makeRouteDecoder(route: Route.Any): CompiledEntry["decode"] {
  const query = Path.getQueryInputParameters(route.ast);
  const decodeParams = Schema.decodeUnknownEffect(route.paramsSchema);
  const decodeQuery = Schema.decodeUnknownEffect(Path.getQueryInputSchema(route.ast));

  return (input) => {
    const normalized =
      typeof input === "object" && input !== null
        ? { ...(input as Record<PropertyKey, unknown>) }
        : {};

    if (query.length === 0) return decodeParams(normalized);

    return decodeQuery(input).pipe(
      Effect.flatMap((decoded) => {
        const queryInput = decoded as Record<PropertyKey, unknown>;
        for (const parameter of query) {
          if (parameter.outputName !== undefined && parameter.inputName in queryInput) {
            normalized[parameter.outputName] = queryInput[parameter.inputName];
          }
        }
        return decodeParams(normalized);
      }),
    );
  };
}

function applyPrefixes(route: Route.Any, prefixes: ReadonlyArray<RouteAst>): Route.Any {
  if (prefixes.length === 0) return route;
  const prefixRoutes = prefixes
    .map((prefix) => makeRoute(prefix))
    .filter((prefix) => prefix.path !== "/");
  if (prefixRoutes.length === 0) return route;
  return Join(...prefixRoutes, route);
}

export { makeCatchManager, makeLayerManager, makeLayoutManager };
