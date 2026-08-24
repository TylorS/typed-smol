import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import { hasProperty, isObject, isString } from "effect/Predicate";
import * as Result from "effect/Result";
import * as Schema from "effect/Schema";
import type { Unify } from "effect/Unify";

export interface Progress {
  readonly loaded: number;
  readonly total?: number | undefined;
}

export interface NoData {
  readonly _tag: "NoData";
}

export interface Loading {
  readonly _tag: "Loading";
  readonly progress?: Progress | undefined;
}

export interface Success<A> {
  readonly _tag: "Success";
  readonly value: A;
  readonly progress?: Progress | undefined;
}

export interface Failure<E> {
  readonly _tag: "Failure";
  readonly cause: Cause.Cause<E>;
  readonly progress?: Progress | undefined;
}

export interface Optimistic<A, E> {
  readonly _tag: "Optimistic";
  readonly value: A;
  readonly previous: AsyncData<A, E>;
}

export type AsyncData<A, E> = NoData | Loading | Success<A> | Failure<E> | Optimistic<A, E>;

export type Refreshing<A, E> = (Success<A> | Failure<E>) & { readonly progress: Progress };

type EncodedFailure = {
  readonly _tag: "Failure";
  readonly cause: Schema.Json;
  readonly progress?: Progress | undefined;
};

type EncodedOptimistic<A, E> = {
  readonly _tag: "Optimistic";
  readonly value: A;
  readonly previous: EncodedAsyncData<A, E>;
};

type EncodedAsyncData<A, E> =
  | NoData
  | Loading
  | Success<A>
  | EncodedFailure
  | EncodedOptimistic<A, E>;

export const AsyncData = <const A extends Schema.Top, E extends Schema.Top>(
  A: A,
  E: E,
): Schema.Codec<
  AsyncData<A["Type"], E["Type"]>,
  EncodedAsyncData<A["Encoded"], E["Encoded"]>,
  A["DecodingServices"] | E["DecodingServices"],
  A["EncodingServices"] | E["EncodingServices"]
> => {
  const Progress = Schema.Struct({ loaded: Schema.Finite, total: Schema.optional(Schema.Finite) });
  const NoData = Schema.Struct({ _tag: Schema.tag("NoData") });
  const Loading = Schema.Struct({
    _tag: Schema.tag("Loading"),
    progress: Schema.optional(Progress),
  });
  const Success = Schema.Struct({
    _tag: Schema.tag("Success"),
    value: A,
    progress: Schema.optional(Progress),
  });
  const CauseSchema = Schema.Cause(E, Schema.Defect());
  const Failure = Schema.Struct({
    _tag: Schema.tag("Failure"),
    cause: Schema.toCodecJson(CauseSchema),
    progress: Schema.optional(Progress),
  });
  const Optimistic = Schema.Struct({
    _tag: Schema.tag("Optimistic"),
    value: A,
    previous: Schema.suspend(() => AsyncDataSchema),
  });
  const AsyncDataSchema = Schema.Union([
    NoData,
    Loading,
    Success,
    Failure,
    Optimistic,
  ]) as Schema.Codec<
    AsyncData<A["Type"], E["Type"]>,
    EncodedAsyncData<A["Encoded"], E["Encoded"]>,
    A["DecodingServices"] | E["DecodingServices"],
    A["EncodingServices"] | E["EncodingServices"]
  >;
  return AsyncDataSchema;
};

export const isNoData = <A, E>(asyncData: AsyncData<A, E>): asyncData is NoData =>
  asyncData._tag === "NoData";
export const isLoading = <A, E>(asyncData: AsyncData<A, E>): asyncData is Loading =>
  asyncData._tag === "Loading";
export const isSuccess = <A, E>(asyncData: AsyncData<A, E>): asyncData is Success<A> =>
  asyncData._tag === "Success";
export const isFailure = <A, E>(asyncData: AsyncData<A, E>): asyncData is Failure<E> =>
  asyncData._tag === "Failure";
export const isOptimistic = <A, E>(asyncData: AsyncData<A, E>): asyncData is Optimistic<A, E> =>
  asyncData._tag === "Optimistic";

const hasValidProgress = (u: object): boolean => {
  if (!hasProperty(u, "progress") || u.progress === undefined) {
    return true;
  }
  const progress = u.progress;
  return (
    isObject(progress) &&
    hasProperty(progress, "loaded") &&
    typeof progress.loaded === "number" &&
    Number.isFinite(progress.loaded) &&
    (!hasProperty(progress, "total") ||
      progress.total === undefined ||
      (typeof progress.total === "number" && Number.isFinite(progress.total)))
  );
};

export const isAsyncData = <A, E>(u: unknown): u is AsyncData<A, E> => {
  const visited = new WeakSet<object>();
  let current = u;
  while (isObject(current) && hasProperty(current, "_tag") && isString(current._tag)) {
    switch (current._tag) {
      case "NoData":
        return true;
      case "Loading":
        return hasValidProgress(current);
      case "Success":
        return hasProperty(current, "value") && hasValidProgress(current);
      case "Failure":
        return (
          hasProperty(current, "cause") &&
          Cause.isCause(current.cause) &&
          hasValidProgress(current)
        );
      case "Optimistic":
        if (
          visited.has(current) ||
          !hasProperty(current, "value") ||
          !hasProperty(current, "previous")
        ) {
          return false;
        }
        visited.add(current);
        current = current.previous;
        break;
      default:
        return false;
    }
  }
  return false;
};

export const isRefreshing = <A, E>(asyncData: AsyncData<A, E>): asyncData is Refreshing<A, E> =>
  (asyncData._tag === "Success" || asyncData._tag === "Failure") &&
  asyncData.progress !== undefined;

export const isPending = <A, E>(
  asyncData: AsyncData<A, E>,
): asyncData is Loading | Refreshing<A, E> => {
  const visited = new WeakSet<object>();
  let current: AsyncData<A, E> = asyncData;
  while (isOptimistic(current)) {
    if (visited.has(current)) {
      return false;
    }
    visited.add(current);
    current = current.previous;
  }
  return current._tag === "Loading" || isRefreshing(current);
};

export const NoData: NoData = { _tag: "NoData" };

export const loading = (progress?: Progress): Loading => ({ _tag: "Loading", progress });

export const success = <A>(value: A, progress?: Progress): Success<A> => ({
  _tag: "Success",
  value,
  progress,
});

export const failure = <E>(cause: Cause.Cause<E>, progress?: Progress): Failure<E> => ({
  _tag: "Failure",
  cause,
  progress,
});

export const optimistic = <A, E>(previous: AsyncData<A, E>, value: A): Optimistic<A, E> => ({
  _tag: "Optimistic",
  value,
  previous,
});

const optimisticHistory = <A, E>(data: AsyncData<A, E>) => {
  const values: Array<A> = [];
  const visited = new WeakSet<object>();
  let current = data;
  while (isOptimistic(current)) {
    if (visited.has(current)) {
      throw new TypeError("Cyclic Optimistic history");
    }
    visited.add(current);
    values.push(current.value);
    current = current.previous;
  }
  return { base: current, values };
};

const rebuildOptimistic = <A, E>(base: AsyncData<A, E>, values: ReadonlyArray<A>) => {
  let current = base;
  for (let index = values.length - 1; index >= 0; index--) {
    current = optimistic(current, values[index]!);
  }
  return current;
};

const refreshingProgress = (progress?: Progress, existing?: Progress): Progress =>
  progress ?? existing ?? { loaded: 0 };

export const startLoading = <A, E>(data: AsyncData<A, E>, progress?: Progress): AsyncData<A, E> => {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E>;
  if (isSuccess(base)) {
    result = success(base.value, refreshingProgress(progress, base.progress));
  } else if (isFailure(base)) {
    result = failure(base.cause, refreshingProgress(progress, base.progress));
  } else if (isLoading(base)) {
    result = loading(progress ?? base.progress);
  } else {
    result = loading(progress);
  }
  return rebuildOptimistic(result, values);
};

export const stopLoading = <A, E>(data: AsyncData<A, E>): AsyncData<A, E> => {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E>;
  if (isSuccess(base)) {
    result = success(base.value);
  } else if (isFailure(base)) {
    result = failure(base.cause);
  } else {
    result = base;
  }
  return rebuildOptimistic(result, values);
};

export const match: {
  <A, E, R1, R2, R3, R4, R5>(matchers: {
    NoData: (data: NoData) => R1;
    Loading: (data: Loading) => R2;
    Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
    Success: (value: A, data: Success<A>) => R4;
    Optimistic: (value: A, data: Optimistic<A, E>) => R5;
  }): (data: AsyncData<A, E>) => Unify<R1 | R2 | R3 | R4 | R5>;

  <A, E, R1, R2, R3, R4, R5>(
    data: AsyncData<A, E>,
    matchers: {
      NoData: (data: NoData) => R1;
      Loading: (data: Loading) => R2;
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
      Success: (value: A, data: Success<A>) => R4;
      Optimistic: (value: A, data: Optimistic<A, E>) => R5;
    },
  ): Unify<R1 | R2 | R3 | R4 | R5>;
} = dual(
  2,
  <A, E, R1, R2, R3, R4, R5>(
    data: AsyncData<A, E>,
    matchers: {
      NoData: (data: NoData) => R1;
      Loading: (data: Loading) => R2;
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3;
      Success: (value: A, data: Success<A>) => R4;
      Optimistic: (value: A, data: Optimistic<A, E>) => R5;
    },
  ): Unify<R1 | R2 | R3 | R4> => {
    if (isSuccess(data)) {
      return matchers.Success(data.value, data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isFailure(data)) {
      return matchers.Failure(data.cause, data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isLoading(data)) {
      return matchers.Loading(data) as Unify<R1 | R2 | R3 | R4>;
    } else if (isNoData(data)) {
      return matchers.NoData(data) as Unify<R1 | R2 | R3 | R4>;
    } else {
      return matchers.Optimistic(data.value, data) as Unify<R1 | R2 | R3 | R4>;
    }
  },
);

export function getSuccess<A, E>(data: AsyncData<A, E>): Option.Option<A> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Option.none,
    Success: Option.some,
    Optimistic: Option.some,
  });
}

/**
 * @since 1.0.0
 */
export function getCause<A, E>(data: AsyncData<A, E>): Option.Option<Cause.Cause<E>> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Option.some,
    Success: Option.none,
    Optimistic: Option.none,
  });
}

/**
 * @since 1.0.0
 */
export function getError<A, E>(data: AsyncData<A, E>): Option.Option<E> {
  return match(data, {
    NoData: Option.none,
    Loading: Option.none,
    Failure: Cause.findErrorOption,
    Success: Option.none,
    Optimistic: Option.none,
  });
}

export const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<A, E>) => AsyncData<B, E>;
  <A, E, B>(data: AsyncData<A, E>, f: (a: A) => B): AsyncData<B, E>;
} = dual(2, function map<A, E, B>(data: AsyncData<A, E>, f: (a: A) => B): AsyncData<B, E> {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<B, E>;
  if (isSuccess(base)) {
    result = success(f(base.value), base.progress);
  } else {
    result = base;
  }
  for (let index = values.length - 1; index >= 0; index--) {
    result = optimistic(result, f(values[index]!));
  }
  return result;
});

export const flatMap: {
  <A, B, E2>(
    f: (a: A, data: Success<A> | Optimistic<A, unknown>) => AsyncData<B, E2>,
  ): <E>(data: AsyncData<A, E>) => AsyncData<B, E | E2>;
  <A, E, B, E2>(
    data: AsyncData<A, E>,
    f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E2>,
  ): AsyncData<B, E | E2>;
} = dual(2, function <
  A,
  E,
  B,
  E2,
>(data: AsyncData<A, E>, f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E2>): AsyncData<
  B,
  E | E2
> {
  if (isSuccess(data) || isOptimistic(data)) {
    return f(data.value, data);
  } else {
    return data;
  }
});

export const mapError: {
  <A, E, E2>(f: (e: E) => E2): (data: AsyncData<A, E>) => AsyncData<A, E2>;
  <A, E, E2>(data: AsyncData<A, E>, f: (e: E) => E2): AsyncData<A, E2>;
} = dual(2, function mapError<A, E, E2>(data: AsyncData<A, E>, f: (e: E) => E2): AsyncData<A, E2> {
  const { base, values } = optimisticHistory(data);
  let result: AsyncData<A, E2>;
  if (isFailure(base)) {
    result = failure(Cause.map(base.cause, f), base.progress);
  } else {
    result = base;
  }
  return rebuildOptimistic(result, values);
});

export const fromExit = <A, E>(exit: Exit.Exit<A, E>): AsyncData<A, E> =>
  Exit.isSuccess(exit) ? success(exit.value) : failure(exit.cause);

export const fromResult = <A, E>(result: Result.Result<A, E>): AsyncData<A, E> =>
  Result.isSuccess(result) ? success(result.success) : failure(Cause.fail(result.failure));
