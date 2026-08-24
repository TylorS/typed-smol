import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { interrupt } from "effect/Exit";
import { identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { makeFormatterDefault } from "effect/SchemaIssue";
import * as Semaphore from "effect/Semaphore";
import * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import { exit } from "@typed/fx/Fx";
import { mapEffect } from "@typed/fx/Fx/combinators/mapEffect";
import { provideContext } from "@typed/fx/Fx/combinators/provide";
import { skipRepeats } from "@typed/fx/Fx/combinators/skipRepeats";
import { switchMap } from "@typed/fx/Fx/combinators/switchMap";
import { succeed } from "@typed/fx/Fx/constructors/succeed";
import type { AnyCatch, AnyLayer, AnyLayout, AnyServiceMap, CompiledEntry } from "./Matcher.js";
import type { Router } from "./Router.js";

export interface RouteTransition {
  readonly path: string;
  readonly input: unknown;
  readonly candidates: ReadonlyArray<CompiledEntry>;
  readonly layers?: ReadonlyArray<AnyLayer>;
}

export interface RouteExecutor<A, E = never, R = never> {
  readonly transition: (
    transition: RouteTransition,
  ) => Effect.Effect<
    Fx.Fx<A, E, R | Scope.Scope | Router>,
    E | RouteDecodeError | RouteGuardError,
    R
  >;
}

export function makeRouteExecutor<A, E = never, R = never>(): Effect.Effect<
  RouteExecutor<A, E, R>,
  never,
  R | Scope.Scope
> {
  return Effect.gen(function* () {
    const fiberId = yield* Effect.fiberId;
    const rootScope = yield* Effect.scope;
    const ambient = yield* Effect.context<R>();
    const memoMap = yield* Layer.makeMemoMap;
    const layerManager = makeLayerManager(memoMap, rootScope, fiberId);
    const layoutManager = makeLayoutManager(rootScope, fiberId);
    const catchManager = makeCatchManager(rootScope, fiberId);
    const lock = Semaphore.makeUnsafe(1).withPermits(1);

    let currentState: {
      readonly entry: CompiledEntry;
      readonly params: RefSubject.RefSubject<any>;
      readonly fx: Fx.Fx<A, E, R | Scope.Scope | Router>;
      readonly scope: Scope.Closeable;
    } | null = null;

    const transition = Effect.fn(function* ({
      path,
      input,
      candidates,
      layers = [],
    }: RouteTransition) {
      const guardCauses: Array<Cause.Cause<any>> = [];
      let firstDecodeError: RouteDecodeError | undefined;
      let decodedCandidate = false;
      let matchedEntry: CompiledEntry | undefined;
      let matchedParams: any;
      let matchedPrepared:
        | {
            readonly services: AnyServiceMap;
            readonly commit: Effect.Effect<void>;
            readonly rollback: Effect.Effect<void>;
          }
        | undefined;
      let matchedServices: Context.Context<any> | undefined;

      for (const entry of candidates) {
        const decoded = yield* entry.decode(input).pipe(
          Effect.map(Option.some),
          Effect.catch((cause) => {
            firstDecodeError ??= new RouteDecodeError({
              path,
              cause: makeFormatterDefault()(cause.issue),
            });
            return Effect.succeedNone;
          }),
        );
        if (Option.isNone(decoded)) continue;

        decodedCandidate = true;
        const params = decoded.value;
        const prepared = yield* layerManager.prepare([...entry.layers, ...layers]);
        const services = Context.merge(ambient, prepared.services);
        const guardExit = yield* entry
          .guard(params)
          .pipe(Effect.provideContext(services), Effect.exit);

        if (Exit.isFailure(guardExit)) {
          guardCauses.push(guardExit.cause);
          yield* prepared.rollback;
          continue;
        }
        if (Option.isNone(guardExit.value)) {
          yield* prepared.rollback;
          continue;
        }

        matchedEntry = entry;
        matchedParams = guardExit.value.value;
        matchedPrepared = prepared;
        matchedServices = services;
        break;
      }

      if (
        matchedEntry === undefined ||
        matchedPrepared === undefined ||
        matchedServices === undefined
      ) {
        if (!decodedCandidate && firstDecodeError !== undefined) {
          return yield* firstDecodeError;
        }
        return yield* new RouteGuardError({ path, causes: guardCauses });
      }

      yield* matchedPrepared.commit;

      if (currentState !== null && currentState.entry === matchedEntry) {
        yield* RefSubject.set(currentState.params, matchedParams);
        yield* layoutManager.updateParams(matchedEntry.layouts, matchedParams);
        return currentState.fx;
      }

      if (currentState !== null) {
        yield* Scope.close(currentState.scope, interrupt(fiberId));
        currentState = null;
      }

      const scope = yield* Scope.fork(rootScope);
      const params = yield* RefSubject.make(matchedParams).pipe(Scope.provide(scope));
      const handlerServices = Context.add(matchedServices, Scope.Scope, scope);
      const handler = matchedEntry.handler(params).pipe(provideContext(handlerServices));
      const withLayouts = yield* layoutManager.apply(
        matchedEntry.layouts,
        matchedParams,
        handler,
        matchedServices,
      );
      const fx = yield* catchManager.apply(matchedEntry.catches, withLayouts, matchedServices);

      currentState = {
        entry: matchedEntry,
        params,
        scope,
        fx: fx as Fx.Fx<A, E, R | Scope.Scope | Router>,
      };
      return currentState.fx;
    });

    return { transition: (input) => lock(transition(input)) } satisfies RouteExecutor<A, E, R>;
  });
}

export class RouteGuardError extends Schema.Error<RouteGuardError>("@typed/router/RouteGuardError")(
  {
    _tag: Schema.tag("RouteGuardError"),
    path: Schema.String,
    causes: Schema.Array(Schema.Unknown),
  },
) {}

export class RouteNotFound extends Schema.Error<RouteNotFound>("@typed/router/RouteNotFound")({
  _tag: Schema.tag("RouteNotFound"),
  path: Schema.String,
}) {}

export class RouteDecodeError extends Schema.Error<RouteDecodeError>(
  "@typed/router/RouteDecodeError",
)({
  _tag: Schema.tag("RouteDecodeError"),
  path: Schema.String,
  cause: Schema.String,
}) {}

const closeScopes = (scopes: Iterable<Scope.Closeable>, fiberId: number) =>
  Effect.forEach(scopes, (scope) => Scope.close(scope, interrupt(fiberId)), {
    concurrency: "unbounded",
    discard: true,
  });

/** @internal */
export function makeLayerManager(memoMap: Layer.MemoMap, rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<AnyLayer, { scope: Scope.Closeable; services: AnyServiceMap }>();
  let order: ReadonlyArray<AnyLayer> = [];
  let cachedDesiredSet: Set<AnyLayer> | undefined;
  let cachedOrder: ReadonlyArray<AnyLayer> | undefined;

  const prepare = (desired: ReadonlyArray<AnyLayer>) =>
    Effect.gen(function* () {
      const desiredSet =
        cachedOrder === desired
          ? cachedDesiredSet!
          : ((cachedDesiredSet = new Set(desired)), (cachedOrder = desired), cachedDesiredSet);
      const removed = order.filter((layer) => !desiredSet.has(layer));
      const added: Array<AnyLayer> = [];
      let services = Context.empty();

      for (const layer of desired) {
        const existing = states.get(layer);
        if (existing) {
          services = Context.merge(services, existing.services);
          continue;
        }

        const scope = yield* Scope.fork(rootScope);
        const buildExit = yield* Layer.buildWithMemoMap(layer, memoMap, scope).pipe(
          Effect.provideContext(services),
          Effect.exit,
        );

        if (Exit.isFailure(buildExit)) {
          for (let i = added.length - 1; i >= 0; i--) {
            const addedLayer = added[i];
            const addedState = states.get(addedLayer);
            if (addedState) {
              states.delete(addedLayer);
              yield* Scope.close(addedState.scope, interrupt(fiberId));
            }
          }
          yield* Scope.close(scope, buildExit);
          return yield* Effect.failCause(buildExit.cause);
        }

        const servicesForLayer = buildExit.value;
        services = Context.merge(services, servicesForLayer);
        states.set(layer, { scope, services: servicesForLayer });
        added.push(layer);
      }

      const commit = Effect.gen(function* () {
        for (let i = removed.length - 1; i >= 0; i--) {
          const layer = removed[i];
          const state = states.get(layer);
          if (state) {
            states.delete(layer);
            yield* Scope.close(state.scope, interrupt(fiberId));
          }
        }
        order = desired;
      });

      const rollback = Effect.gen(function* () {
        for (let i = added.length - 1; i >= 0; i--) {
          const layer = added[i];
          const state = states.get(layer);
          if (state) {
            states.delete(layer);
            yield* Scope.close(state.scope, interrupt(fiberId));
          }
        }
      });

      return { services, commit, rollback };
    });

  return { prepare };
}

/** @internal */
export function makeLayoutManager(rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<
    AnyLayout,
    {
      params: RefSubject.RefSubject<any>;
      content: RefSubject.RefSubject<Fx.Fx<any, any, any>>;
      fx: Fx.Fx<any, any, any>;
      scope: Scope.Closeable;
    }
  >();
  let active: ReadonlyArray<AnyLayout> = [];

  const removeUnused = (layouts: ReadonlyArray<AnyLayout>) =>
    Effect.gen(function* () {
      const next = new Set(layouts);
      const removed = active.filter((layout) => !next.has(layout));
      const scopes = removed.map((layout) => {
        const state = states.get(layout)!;
        states.delete(layout);
        return state.scope;
      });
      yield* closeScopes(scopes, fiberId);
      active = layouts;
    });

  const apply = (
    layouts: ReadonlyArray<AnyLayout>,
    paramsValue: any,
    inner: Fx.Fx<any, any, any>,
    services: Context.Context<any>,
  ) =>
    Effect.gen(function* () {
      let current = inner;
      for (let i = layouts.length - 1; i >= 0; i--) {
        const layout = layouts[i];
        const state = states.get(layout);
        if (state === undefined) {
          const scope = yield* Scope.fork(rootScope);
          const params = yield* RefSubject.make(paramsValue).pipe(Scope.provide(scope));
          const content = yield* RefSubject.make<Fx.Fx<any, any, any>>(Effect.succeed(current), {
            eq: (left, right) => left === right,
          }).pipe(Scope.provide(scope));
          const fx = layout({ params, content: content.pipe(switchMap(identity)) }).pipe(
            provideContext(Context.merge(services, Context.make(Scope.Scope, scope))),
          );
          states.set(layout, { params, content, fx, scope });
          current = fx;
        } else {
          yield* RefSubject.set(state.params, paramsValue);
          yield* RefSubject.set(state.content, current);
          current = state.fx;
        }
      }
      yield* removeUnused(layouts);
      return current;
    });

  const updateParams = (layouts: ReadonlyArray<AnyLayout>, paramsValue: any) =>
    Effect.forEach(
      layouts,
      (layout) => {
        const state = states.get(layout);
        return state !== undefined ? RefSubject.set(state.params, paramsValue) : Effect.void;
      },
      { discard: true },
    );

  return { apply, updateParams };
}

/** @internal */
export function makeCatchManager(rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<
    AnyCatch,
    {
      causes: RefSubject.RefSubject<Cause.Cause<any>>;
      content: RefSubject.RefSubject<Fx.Fx<any, any, any>>;
      fx: Fx.Fx<any, any, any>;
      scope: Scope.Closeable;
    }
  >();
  let active: ReadonlyArray<AnyCatch> = [];

  const removeUnused = (catches: ReadonlyArray<AnyCatch>) =>
    Effect.gen(function* () {
      const next = new Set(catches);
      const removed = active.filter((catcher) => !next.has(catcher));
      const scopes = removed.map((catcher) => {
        const state = states.get(catcher)!;
        states.delete(catcher);
        return state.scope;
      });
      yield* closeScopes(scopes, fiberId);
      active = catches;
    });

  const apply = (
    catches: ReadonlyArray<AnyCatch>,
    inner: Fx.Fx<any, any, any>,
    services: Context.Context<any>,
  ) =>
    Effect.gen(function* () {
      let current = inner;
      for (let i = catches.length - 1; i >= 0; i--) {
        const catcher = catches[i];
        const state = states.get(catcher);
        if (state === undefined) {
          const scope = yield* Scope.fork(rootScope);
          const causes = yield* RefSubject.make<Cause.Cause<any>>(Cause.fail(undefined)).pipe(
            Scope.provide(scope),
          );
          const content = yield* RefSubject.make<Fx.Fx<any, any, any>>(Effect.succeed(current), {
            eq: (left, right) => left === right,
          }).pipe(Scope.provide(scope));
          const fallback = catcher(causes).pipe(
            provideContext(Context.merge(services, Context.make(Scope.Scope, scope))),
          );
          const fx = content.pipe(
            switchMap(identity),
            exit,
            mapEffect(
              Effect.fn(function* (result) {
                if (Exit.isSuccess(result)) return succeed(result.value);
                yield* RefSubject.set(causes, result.cause);
                return fallback;
              }),
            ),
            skipRepeats,
            switchMap(identity),
          );
          states.set(catcher, { causes, content, fx, scope });
          current = fx;
        } else {
          yield* RefSubject.set(state.content, current);
          current = state.fx;
        }
      }
      yield* removeUnused(catches);
      return current;
    });

  return { apply };
}
