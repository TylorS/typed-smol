/**
 * RefSubject bindings for AsyncData lifecycle state.
 * @since 1.18.0
 */

import * as AsyncData from "@typed/async-data";
import type * as Cause from "effect/Cause";
import type * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { Equivalence } from "effect/Equivalence";
import type * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import type { Unify } from "effect/Unify";
import * as Fx from "../Fx/index.js";
import { skip } from "../Fx/combinators/skip.js";
import { observe } from "../Fx/run/observe.js";
import * as RefSubject from "./RefSubject.js";
import { equals } from "effect/Equal";

/**
 * A RefAsyncData is a RefSubject specialized over AsyncData state.
 * @since 1.18.0
 * @category models
 */
export interface RefAsyncData<
  in out A,
  in out E,
  in out Err = never,
  out R = never,
> extends RefSubject.RefSubject<AsyncData.AsyncData<A, E>, Err, R> {}

export declare namespace RefAsyncData {
  export interface Service<
    Self,
    Id extends string,
    A,
    E,
    Err = never,
  > extends RefSubject.RefSubject<AsyncData.AsyncData<A, E>, Err, Self> {
    readonly id: Id;

    readonly service: Context.Service<Self, RefAsyncData<A, E, Err>>;

    readonly make: <R = never>(
      value: AsyncData.AsyncData<A, E> | Effect.Effect<A, E, R>,
    ) => Layer.Layer<Self, never, Exclude<R, Scope.Scope>>;

    readonly layer: <E2, R2>(
      make: Effect.Effect<RefAsyncData<A, E, Err>, E2, R2 | Scope.Scope>,
    ) => Layer.Layer<Self, E2, Exclude<R2, Scope.Scope>>;
  }

  export interface Class<Self, Id extends string, A, E, Err = never> extends Service<
    Self,
    Id,
    A,
    E,
    Err
  > {
    new (): Service<Self, Id, A, E, Err>;
  }
}

/**
 * Creates a new RefAsyncData from AsyncData, Effect, or Fx state.
 * @since 1.18.0
 * @category constructors
 */
export function make<A, E, Err = never, R = never>(
  initial?:
    | AsyncData.AsyncData<A, E>
    | Effect.Effect<AsyncData.AsyncData<A, E>, Err, R>
    | Fx.Fx<AsyncData.AsyncData<A, E>, Err, R>,
  options?: {
    errorEq?: Equivalence<E>;
    valueEq?: Equivalence<A>;
  },
): Effect.Effect<RefAsyncData<A, E, Err, R>, never, R | Scope.Scope> {
  return RefSubject.make(initial ?? AsyncData.NoData, {
    eq: AsyncData.makeEquivalence(options?.valueEq ?? equals, options?.errorEq ?? equals),
  });
}

/**
 * Creates RefAsyncData from an Effect by capturing its Exit as AsyncData.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<RefAsyncData<A, E, never, R>, never, R | Scope.Scope> {
  return make(
    Fx.mergeAll(
      Fx.succeed(AsyncData.NoData),
      Fx.sync(() => AsyncData.loading()),
      Fx.fromEffect(effect.pipe(Effect.exit, Effect.map(AsyncData.fromExit))),
    )
  );
}

function normalizeInitial<A, E, R>(
  value: AsyncData.AsyncData<A, E> | Effect.Effect<A, E, R>,
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R> {
  if (Effect.isEffect(value)) return Effect.exit(value).pipe(Effect.map(AsyncData.fromExit));
  return Effect.succeed(value);
}

/**
 * Creates a service tag for RefAsyncData state.
 * @since 1.18.0
 * @category constructors
 */
export function Service<Self, A, E, Err = never>() {
  return <const Id extends string>(id: Id): RefAsyncData.Class<Self, Id, A, E, Err> => {
    const service = RefSubject.Service<Self, AsyncData.AsyncData<A, E>, Err>()(id);

    return class RefAsyncDataService {
      static {
        Object.assign(this, service);
        Object.setPrototypeOf(this, Object.getPrototypeOf(service));
      }

      static readonly id = id;
      static readonly service = service.service as Context.Service<Self, RefAsyncData<A, E, Err>>;
      static readonly layer = service.layer as RefAsyncData.Service<Self, Id, A, E, Err>["layer"];
      static readonly make = <R = never>(
        value: AsyncData.AsyncData<A, E> | Effect.Effect<A, E, R>,
      ): Layer.Layer<Self, never, Exclude<R, Scope.Scope>> => {
        const initial = normalizeInitial(value);
        return service.make(initial) as Layer.Layer<Self, never, Exclude<R, Scope.Scope>>;
      };

      constructor() {
        return RefAsyncDataService;
      }
    } as unknown as RefAsyncData.Class<Self, Id, A, E, Err>;
  };
}

/**
 * Creates RefAsyncData from a reactive input and refreshes it whenever the
 * input changes. The initial input is loaded before the RefAsyncData is
 * returned, which keeps SSR output deterministic while still allowing browser
 * navigation updates to flow through loading/success/failure states.
 *
 * @since 1.18.0
 * @category constructors
 */
export function fromComputedEffect<I, A, E, E2, R, R2>(
  input: RefSubject.Computed<I, E2, R>,
  f: (input: I) => Effect.Effect<A, E, R2>,
  progress?: AsyncData.Progress,
): Effect.Effect<RefAsyncData<A, E2 | E, never, R | R2>, never, Scope.Scope | R | R2> {
  return Effect.gen(function* () {
    const initial = yield* Effect.flatMap(input, f).pipe(
      Effect.exit,
      Effect.map(AsyncData.fromExit),
    );
    const ref = yield* make(initial);

    yield* input.pipe(
      skip(1),
      observe((next) => refresh(ref, f(next), progress)),
      Effect.forkScoped,
    );

    return ref;
  });
}

/**
 * Refreshes a RefAsyncData by setting loading state, running the Effect, and
 * storing success or failure in the AsyncData value.
 * @since 1.18.0
 * @category combinators
 */
export const refresh: <A, E, Err, R, R2>(
  ref: RefAsyncData<A, E, Err, R>,
  effect: Effect.Effect<A, E, R2>,
  progress?: AsyncData.Progress,
) => Effect.Effect<AsyncData.AsyncData<A, E>, Err, R | R2> = Effect.fn(
  function* (ref, effect, progress) {
    return yield* ref.updates(
      Effect.fn(function* (txn) {
        const current = yield* txn.get;
        yield* txn.set(AsyncData.startLoading(current, progress));
        const next = yield* Effect.exit(effect).pipe(Effect.map(AsyncData.fromExit));
        return yield* txn.set(next);
      }),
    );
  },
);

/**
 * Sets RefAsyncData to NoData.
 * @since 1.18.0
 * @category combinators
 */
export const setNoData: <A, E, Err, R>(
  ref: RefAsyncData<A, E, Err, R>,
) => Effect.Effect<AsyncData.AsyncData<A, E>, Err, R> = Effect.fn(function* (ref) {
  return yield* RefSubject.set(ref, AsyncData.NoData);
});

/**
 * Starts loading while preserving any existing success or failure value.
 * @since 1.18.0
 * @category combinators
 */
export const setLoading: <A, E, Err, R>(
  ref: RefAsyncData<A, E, Err, R>,
  progress?: AsyncData.Progress,
) => Effect.Effect<AsyncData.AsyncData<A, E>, Err, R> = Effect.fn(function* (ref, progress) {
  return yield* RefSubject.update(ref, (data) => AsyncData.startLoading(data, progress));
});

/**
 * Sets RefAsyncData to Success(value).
 * @since 1.18.0
 * @category combinators
 */
export const setSuccess: <A, E, Err, R>(
  ref: RefAsyncData<A, E, Err, R>,
  value: A,
  progress?: AsyncData.Progress,
) => Effect.Effect<AsyncData.AsyncData<A, E>, Err, R> = Effect.fn(function* (ref, value, progress) {
  return yield* RefSubject.set(ref, AsyncData.success(value, progress));
});

/**
 * Sets RefAsyncData to Failure(cause).
 * @since 1.18.0
 * @category combinators
 */
export const setFailure: <A, E, Err, R>(
  ref: RefAsyncData<A, E, Err, R>,
  cause: Cause.Cause<E>,
  progress?: AsyncData.Progress,
) => Effect.Effect<AsyncData.AsyncData<A, E>, Err, R> = Effect.fn(function* (ref, cause, progress) {
  return yield* RefSubject.set(ref, AsyncData.failure(cause, progress));
});

/**
 * Matches the current AsyncData state into a computed value.
 * @since 1.18.0
 * @category computed
 */
export function match<A, E, Err, R, R1, R2, R3, R4, R5>(
  ref: RefAsyncData<A, E, Err, R>,
  matchers: {
    readonly NoData: (data: AsyncData.NoData) => R1;
    readonly Loading: (data: AsyncData.Loading) => R2;
    readonly Failure: (cause: Cause.Cause<E>, data: AsyncData.Failure<E>) => R3;
    readonly Success: (value: A, data: AsyncData.Success<A>) => R4;
    readonly Optimistic: (value: A, data: AsyncData.Optimistic<A, E>) => R5;
  },
): RefSubject.Computed<Unify<R1 | R2 | R3 | R4 | R5>, Err, R> {
  return RefSubject.map(ref, (data) => AsyncData.match(data, matchers));
}

/**
 * Matches AsyncData state into Fx. Success and optimistic branches receive a
 * scoped RefSubject of the current value so renderers can stay reactive.
 * @since 1.18.0
 * @category computed
 */
export function matchFx<
  A,
  E,
  Err,
  R,
  NoDataFx extends Fx.Fx.Any,
  LoadingFx extends Fx.Fx.Any,
  FailureFx extends Fx.Fx.Any,
  SuccessFx extends Fx.Fx.Any,
  OptimisticFx extends Fx.Fx.Any,
>(
  ref: RefAsyncData<A, E, Err, R>,
  matchers: {
    readonly NoData: (data: AsyncData.NoData) => NoDataFx;
    readonly Loading: (data: AsyncData.Loading) => LoadingFx;
    readonly Failure: (cause: Cause.Cause<E>, data: AsyncData.Failure<E>) => FailureFx;
    readonly Success: (
      value: RefSubject.RefSubject<A>,
      data: AsyncData.Success<A>,
    ) => SuccessFx;
    readonly Optimistic: (
      value: RefSubject.RefSubject<A>,
      data: AsyncData.Optimistic<A, E>,
    ) => OptimisticFx;
  },
): RefAsyncDataMatchFxResult<
  Err,
  R,
  NoDataFx,
  LoadingFx,
  FailureFx,
  SuccessFx,
  OptimisticFx
> {
  return Fx.switchMap(ref, (data): RefAsyncDataMatchFxBranch<
    NoDataFx,
    LoadingFx,
    FailureFx,
    SuccessFx,
    OptimisticFx
  > => {
    switch (data._tag) {
      case "NoData":
        return matchers.NoData(data);
      case "Loading":
        return matchers.Loading(data);
      case "Failure":
        return matchers.Failure(data.cause, data);
      case "Success":
        return Fx.unwrap(
          Effect.map(RefSubject.make(data.value), (valueRef) => matchers.Success(valueRef, data)),
        );
      case "Optimistic":
        return Fx.unwrap(
          Effect.map(RefSubject.make(data.value), (valueRef) =>
            matchers.Optimistic(valueRef, data)
          ),
        );
    }
  });
}

type RefAsyncDataMatchFxBranch<
  NoDataFx extends Fx.Fx.Any,
  LoadingFx extends Fx.Fx.Any,
  FailureFx extends Fx.Fx.Any,
  SuccessFx extends Fx.Fx.Any,
  OptimisticFx extends Fx.Fx.Any,
> = Fx.Fx<
  Fx.Success<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx>,
  Fx.Error<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx>,
  Fx.Services<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx> | Scope.Scope
>;

type RefAsyncDataMatchFxResult<
  Err,
  R,
  NoDataFx extends Fx.Fx.Any,
  LoadingFx extends Fx.Fx.Any,
  FailureFx extends Fx.Fx.Any,
  SuccessFx extends Fx.Fx.Any,
  OptimisticFx extends Fx.Fx.Any,
> = Fx.Fx<
  Fx.Success<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx>,
  Err | Fx.Error<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx>,
  R | Fx.Services<NoDataFx | LoadingFx | FailureFx | SuccessFx | OptimisticFx> | Scope.Scope
>;

/**
 * Computes the successful or optimistic value when one is present.
 * @since 1.18.0
 * @category computed
 */
export const value = <A, E, Err, R>(
  ref: RefAsyncData<A, E, Err, R>,
): RefSubject.Filtered<A, Err, R> => RefSubject.filterMap(ref, AsyncData.getSuccess);

/**
 * Maps the successful or optimistic value.
 * @since 1.18.0
 * @category computed
 */
export const map = <A, E, Err, R, B>(
  ref: RefAsyncData<A, E, Err, R>,
  f: (value: A) => B,
): RefSubject.Computed<AsyncData.AsyncData<B, E>, Err, R> =>
  RefSubject.map(ref, (data) => AsyncData.map(data, f));

/**
 * Maps the AsyncData error value.
 * @since 1.18.0
 * @category computed
 */
export const mapError = <A, E, Err, R, E2>(
  ref: RefAsyncData<A, E, Err, R>,
  f: (error: E) => E2,
): RefSubject.Computed<AsyncData.AsyncData<A, E2>, Err, R> =>
  RefSubject.map(ref, (data) => AsyncData.mapError(data, f));
