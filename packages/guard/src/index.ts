/**
 * @since 1.0.0
 */

import type * as Arr from "effect/Array";
import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import type * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import type { ParseOptions } from "effect/SchemaAST";
import type * as Context from "effect/Context";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";

/**
 * An effectful partial transformation.
 *
 * A successful `Some` contains a match, a successful `None` means the input did
 * not match, and an Effect failure remains in the `E` channel. Required
 * services remain in `R`.
 *
 * @since 1.0.0
 */
export type Guard<in I, out O, out E = never, out R = never> = (
  input: I,
) => Effect.Effect<Option.Option<O>, E, R>;

/**
 * @since 1.0.0
 */
export namespace Guard {
  /**
   * @since 1.0.0
   */
  export type Input<T> = [T] extends [Guard<infer I, infer _R, infer _E, infer _O>]
    ? I
    : [T] extends [AsGuard<infer I, infer _R, infer _E, infer _O>]
      ? I
      : never;

  /**
   * @since 1.0.0
   */
  export type Services<T> = [T] extends [Guard<infer _I, infer _O, infer _E, infer R>]
    ? R
    : [T] extends [AsGuard<infer _I, infer _O, infer _E, infer R>]
      ? R
      : never;

  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [Guard<infer _I, infer _O, infer E, infer _R>]
    ? E
    : [T] extends [AsGuard<infer _I, infer _O, infer E, infer _R>]
      ? E
      : never;

  /**
   * @since 1.0.0
   */
  export type Output<T> = [T] extends [Guard<infer _I, infer O, infer _E, infer _R>]
    ? O
    : [T] extends [AsGuard<infer _I, infer O, infer _E, infer _R>]
      ? O
      : never;
}

/**
 * An object that supplies a Guard through an own callable `asGuard` property.
 * Use an instance field rather than a prototype method.
 *
 * @since 1.0.0
 */
export interface AsGuard<in I, out O, out E = never, out R = never> {
  readonly asGuard: () => Guard<I, O, E, R>;
}

/**
 * A Guard or an object that supplies one. Guard combinators accept either form.
 *
 * @since 1.0.0
 */
export type GuardInput<I, O, E = never, R = never> = Guard<I, O, E, R> | AsGuard<I, O, E, R>;

/**
 * Returns a callable Guard unchanged or obtains one from an own callable
 * `asGuard` property. Invalid adapter objects throw `TypeError` immediately.
 *
 * @since 1.0.0
 */
export const getGuard = <I, O, E = never, R = never>(
  guard: GuardInput<I, O, E, R>,
): Guard<I, O, E, R> => {
  if (typeof guard === "function") {
    return guard;
  }

  if (typeof guard !== "object" || guard === null || !Object.hasOwn(guard, "asGuard")) {
    throw new TypeError(
      "Expected a Guard function or an object with an own callable asGuard property",
    );
  }

  const asGuard = guard.asGuard;
  if (typeof asGuard !== "function") {
    throw new TypeError(
      "Expected a Guard function or an object with an own callable asGuard property",
    );
  }

  const normalized = asGuard.call(guard);
  if (typeof normalized !== "function") {
    throw new TypeError("Expected asGuard() to return a Guard function");
  }

  return normalized;
};

const invokeGuard = <I, O, E, R>(
  guard: Guard<I, O, E, R>,
  input: I,
): Effect.Effect<Option.Option<O>, E, R> => Effect.suspend(() => guard(input));

const isObjectRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertObjectRecord = (value: unknown): Record<PropertyKey, unknown> => {
  if (!isObjectRecord(value)) {
    throw new TypeError("Expected a guard object output");
  }
  return value;
};

const copyEnumerableRecord = (source: Record<PropertyKey, unknown>): Record<PropertyKey, unknown> => {
  const output: Record<PropertyKey, unknown> = {};
  for (const key of Reflect.ownKeys(source)) {
    if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
    output[key] = source[key];
  }
  return output;
};

const extendEnumerableRecord = (
  source: Record<PropertyKey, unknown>,
  key: PropertyKey,
  value: unknown,
): Record<PropertyKey, unknown> => {
  if (Object.prototype.propertyIsEnumerable.call(source, key)) {
    throw new TypeError(`Guard output already contains key: ${String(key)}`);
  }
  const output = copyEnumerableRecord(source);
  output[key] = value;
  return output;
};

const mergeEnumerableRecords = (
  base: Record<PropertyKey, unknown>,
  extension: Record<PropertyKey, unknown>,
): Record<PropertyKey, unknown> => {
  const output = copyEnumerableRecord(base);
  for (const key of Reflect.ownKeys(extension)) {
    if (!Object.prototype.propertyIsEnumerable.call(extension, key)) continue;
    if (Object.prototype.propertyIsEnumerable.call(output, key)) {
      throw new TypeError(`Guard output already contains key: ${String(key)}`);
    }
    output[key] = extension[key];
  }
  return output;
};

/**
 * Runs `output` only when `input` matches. `None` short-circuits successfully,
 * while failures and service requirements are preserved from both Guards.
 *
 * @since 1.0.0
 */
export const pipe: {
  <O, B, E2, R2>(
    output: GuardInput<O, B, E2, R2>,
  ): <I, R, E>(input: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>;
  <I, O, E, R, B, E2, R2>(
    input: GuardInput<I, O, E, R>,
    output: GuardInput<O, B, E2, R2>,
  ): Guard<I, B, E | E2, R | R2>;
} = dual(2, function flatMap<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(input: GuardInput<I, O, E, R>, output: GuardInput<O, B, E2, R2>): Guard<I, B, E | E2, R | R2> {
  const g1 = getGuard(input);
  const g2 = getGuard(output);
  return (i) =>
    Effect.flatMapEager(
      invokeGuard(g1, i),
      Option.match({
        onNone: () => Effect.succeedNone,
        onSome: (value) => invokeGuard(g2, value),
      }),
    );
});

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>;
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>,
  ): Guard<I, B, E | E2, R | R2>;
} = dual(2, function mapEffect<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<
  I,
  B,
  E | E2,
  R | R2
> {
  return pipe(guard, (o) => Effect.asSome(f(o)));
});

/**
 * @since 1.0.0
 */
export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>;
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>;
} = dual(2, function map<I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<
  I,
  B,
  E,
  R
> {
  const g = getGuard(guard);
  return (i) => Effect.mapEager(invokeGuard(g, i), Option.map(f));
});

/**
 * @since 1.0.0
 */
export const tap: {
  <O, B, E2 = never, R2 = never>(
    f: (o: O) => void | Effect.Effect<B, E2, R2>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, R | R2>;
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => void | Effect.Effect<B, E2, R2>,
  ): Guard<I, O, E | E2, R | R2>;
} = dual(2, function tap<
  I,
  O,
  E,
  R,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (o: O) => void | Effect.Effect<B, E2, R2>): Guard<
  I,
  O,
  E | E2,
  R | R2
> {
  return pipe(guard, (o) => {
    const x = f(o);
    if (Effect.isEffect(x)) return Effect.as(x, Option.some(o));
    return Effect.succeedSome(o);
  });
});

/**
 * @since 1.0.0
 */
export const filterMap: {
  <O, B>(
    f: (o: O) => Option.Option<B>,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>;
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>;
} = dual(
  2,
  <I, O, E, R, B>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Option.Option<B>,
  ): Guard<I, B, E, R> => {
    const g = getGuard(guard);
    return (i) => Effect.mapEager(invokeGuard(g, i), Option.flatMap(f));
  },
);

/**
 * @since 1.0.0
 */
export const filter: {
  <O, O2 extends O>(
    predicate: (o: O) => o is O2,
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O2, E, R>;
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>;
  <I, O, E, R, O2 extends O>(
    guard: GuardInput<I, O, E, R>,
    predicate: (o: O) => o is O2,
  ): Guard<I, O2, E, R>;
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>;
} = dual(
  2,
  <I, O, E, R, O2 extends O>(
    guard: GuardInput<I, O, E, R>,
    predicate: ((o: O) => o is O2) | ((o: O) => boolean),
  ): Guard<I, O2, E, R> => {
    const g = getGuard(guard);
    return (i) =>
      Effect.mapEager(invokeGuard(g, i), Option.filter(predicate)) as Effect.Effect<
        Option.Option<O2>,
        E,
        R
      >;
  },
);

/**
 * Runs candidates sequentially and returns the first match tagged with its key.
 * Candidates are snapshotted from own enumerable keys when `any` is called.
 * ECMAScript own-key order applies: integer-index strings, other strings, then
 * symbols.
 *
 * @since 1.0.0
 */
export function any<const GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>>(
  guards: GS,
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Services<GS[keyof GS]>> {
  const entries = Reflect.ownKeys(guards)
    .filter((key) => Object.prototype.propertyIsEnumerable.call(guards, key))
    .map((key) => [key, getGuard(guards[key as keyof GS])] as const);
  return (i: AnyInput<GS>) =>
    Effect.gen(function* () {
      for (const [_tag, guard] of entries) {
        const match = yield* invokeGuard(guard, i);
        if (Option.isSome(match)) {
          return Option.some({ _tag, value: match.value } as AnyOutput<GS>);
        }
      }
      return Option.none();
    });
}

/**
 * @since 1.0.0
 */
export type AnyInput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> =
  UnionToIntersection<Guard.Input<GS[keyof GS]>>;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
  ? R
  : never;

/**
 * @since 1.0.0
 */
export type AnyOutput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> };
  }[keyof GS],
] extends [infer R]
  ? R
  : never;

/**
 * Builds a Guard from a predicate or refinement. The predicate is evaluated
 * only when the returned Effect runs. A thrown exception becomes an Effect
 * defect; use an effectful Guard when failure belongs in the typed error channel.
 *
 * @since 1.0.0
 */
export function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>;
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>;
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A> {
  return (a) => Effect.sync(() => (predicate(a) ? Option.some(a) : Option.none()));
}

/**
 * @since 1.0.0
 */
export const catchCause: {
  <E, O2, E2, R2>(
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>;
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>,
  ): Guard<I, O | O2, E2, R | R2>;
} = dual(2, function catchCause<
  I,
  O,
  E,
  R,
  O2,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>): Guard<
  I,
  O | O2,
  E2,
  R | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.catchCause(invokeGuard(g, i), (a) => Effect.asSome(f(a)));
});

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E, O2, E2, R2>(
    f: (e: E) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>;
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: E) => Effect.Effect<O2, E2, R2>,
  ): Guard<I, O | O2, E2, R | R2>;
} = dual(2, function catchAll<
  I,
  O,
  E,
  R,
  O2,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, f: (e: E) => Effect.Effect<O2, E2, R2>): Guard<
  I,
  O | O2,
  E2,
  R | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.catchEager(invokeGuard(g, i), (a) => Effect.asSome(f(a)));
});

export { catchAll as catch };

/**
 * @since 1.0.0
 */
export const catchTag: {
  <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, O2, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): <I, O, R>(
    guard: GuardInput<I, O, E, R>,
  ) => Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  <I, O, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;
} = dual(
  3,
  <I, O, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Effect.Effect<O2, E2, R2>,
  ): Guard<
    I,
    O | O2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > => {
    const g = getGuard(guard);
    return ((i: I) => Effect.catchTag(invokeGuard(g, i), tag, (e) => Effect.asSome(f(e)))) as Guard<
      I,
      O | O2,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >;
  },
);

/**
 * @since 1.0.0
 */
export const provide: {
  <R2>(
    provided: Context.Context<R2>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>;
  <R2, E2, R3>(
    provided: Layer.Layer<R2, E2, R3>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, R2> | R3>;

  <I, O, E, R, R2>(
    guard: GuardInput<I, O, E, R>,
    provided: Context.Context<R2>,
  ): Guard<I, O, E, Exclude<R, R2>>;
  <I, O, E, R, R2, E2, R3>(
    guard: GuardInput<I, O, E, R>,
    provided: Layer.Layer<R2, E2, R3>,
  ): Guard<I, O, E | E2, Exclude<R, R2> | R3>;
} = dual(2, function provide<
  I,
  O,
  E,
  R,
  R2,
>(guard: GuardInput<I, O, E, R>, provided: Context.Context<R2>): Guard<I, O, E, Exclude<R, R2>> {
  const g = getGuard(guard);
  return (i) => Effect.provide(invokeGuard(g, i), provided);
});

/**
 * @since 1.0.0
 */
export const provideService: {
  <Id, S>(
    tag: Context.Service<Id, S>,
    service: S,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, Id>>;
  <I, O, E, R, Id, S>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Service<Id, S>,
    service: S,
  ): Guard<I, O, E, Exclude<R, Id>>;
} = dual(3, function provideService<
  I,
  O,
  E,
  R,
  Id,
  S,
>(guard: GuardInput<I, O, E, R>, tag: Context.Service<Id, S>, service: S): Guard<
  I,
  O,
  E,
  Exclude<R, Id>
> {
  const g = getGuard(guard);
  return (i) => Effect.provideService(invokeGuard(g, i), tag, service);
});

/**
 * @since 1.0.0
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Service<Id, S>,
    service: Effect.Effect<S, E2, R2>,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, Id> | R2>;
  <I, O, E, R, Id, S, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Service<Id, S>,
    service: Effect.Effect<S, E2, R2>,
  ): Guard<I, O, E | E2, Exclude<R, Id> | R2>;
} = dual(3, function provideServiceEffect<
  I,
  O,
  E,
  R,
  Id,
  S,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, tag: Context.Service<Id, S>, service: Effect.Effect<S, E2, R2>): Guard<
  I,
  O,
  E | E2,
  Exclude<R, Id> | R2
> {
  const g = getGuard(guard);
  return (i) => Effect.provideServiceEffect(invokeGuard(g, i), tag, service);
});

const parseOptions: ParseOptions = { errors: "all", onExcessProperty: "ignore" };

/**
 * @since 1.0.0
 */
export function fromSchemaDecode<S extends Schema.Top>(
  schema: S,
): Guard<S["Encoded"], S["Type"], Schema.SchemaError, S["DecodingServices"]> {
  const decode_ = Schema.decodeEffect(schema);
  return (i: S["Encoded"]) => Effect.asSome(decode_(i, parseOptions));
}

/**
 * @since 1.0.0
 */
export function fromSchemaEncode<S extends Schema.Top>(
  schema: S,
): Guard<S["Type"], S["Encoded"], Schema.SchemaError, S["EncodingServices"]> {
  const encode_ = Schema.encodeEffect(schema);
  return (a: S["Type"]) => Effect.asSome(encode_(a, parseOptions));
}

/**
 * @since 1.0.0
 */
export const decode: {
  <S extends Schema.Top>(
    schema: S,
  ): <I, E = never, R = never>(
    guard: GuardInput<I, S["Encoded"], E, R>,
  ) => Guard<I, S["Type"], Schema.SchemaError | E, R | S["DecodingServices"]>;

  <I, E, R, S extends Schema.Top>(
    guard: GuardInput<I, S["Encoded"], E, R>,
    schema: S,
  ): Guard<I, S["Type"], Schema.SchemaError | E, R | S["DecodingServices"]>;
} = dual(2, function decode<
  I,
  E,
  R,
  S extends Schema.Top,
>(guard: GuardInput<I, S["Encoded"], E, R>, schema: S): Guard<
  I,
  S["Type"],
  Schema.SchemaError | E,
  R | S["DecodingServices"]
> {
  return pipe(guard, fromSchemaDecode(schema));
});

/**
 * @since 1.0.0
 */
export const encode: {
  <S extends Schema.Top>(
    schema: S,
  ): <I, E = never, R = never>(
    guard: GuardInput<I, S["Type"], E, R>,
  ) => Guard<I, S["Encoded"], Schema.SchemaError | E, R | S["EncodingServices"]>;

  <I, E, R, S extends Schema.Top>(
    guard: GuardInput<I, S["Type"], E, R>,
    schema: S,
  ): Guard<I, S["Encoded"], Schema.SchemaError | E, R | S["EncodingServices"]>;
} = dual(2, function encode<
  I,
  E,
  R,
  S extends Schema.Top,
>(guard: GuardInput<I, S["Type"], E, R>, schema: S): Guard<
  I,
  S["Encoded"],
  Schema.SchemaError | E,
  R | S["EncodingServices"]
> {
  return pipe(guard, fromSchemaEncode(schema));
});

/**
 * @since 1.0.0
 */
const let_: {
  <K extends PropertyKey, B>(
    key: K,
    value: B,
  ): <G extends GuardInput<any, any, any, any>>(
    guard: G &
      (NoInfer<Guard.Output<G>> extends object ? unknown : never) &
      (K extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
  ) => Guard<Guard.Input<G>, Guard.Output<G> & { [k in K]: B }, Guard.Error<G>, Guard.Services<G>>;

  <G extends GuardInput<any, any, any, any>, K extends PropertyKey, B>(
    guard: G & (NoInfer<Guard.Output<G>> extends object ? unknown : never),
    key: Exclude<
      K,
      NoInfer<Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never>
    >,
    value: B,
  ): Guard<Guard.Input<G>, Guard.Output<G> & { [k in K]: B }, Guard.Error<G>, Guard.Services<G>>;
} = dual(3, function attachProperty<
  I,
  O extends object,
  E,
  R,
  K extends PropertyKey,
  B,
>(guard: GuardInput<I, O, E, R>, key: K, value: B): Guard<I, O & { [k in K]: B }, E, R> {
  return map(guard, (a) =>
    extendEnumerableRecord(assertObjectRecord(a), key, value) as O & { [k in K]: B },
  );
});

export {
  /**
   * Adds a fixed property to every matched object output. The key must not
   * already exist; use `bindTo` first when the prior output is not an object.
   *
   * @since 1.0.0
   */
  let_ as let,
};

/**
 * Adds a readonly `_tag` to every matched object output. The output must not
 * already have an `_tag` property.
 *
 * @since 1.0.0
 */
export const addTag: {
  <B>(
    value: B,
  ): <G extends GuardInput<any, any, any, any>>(
    guard: G &
      (NoInfer<Guard.Output<G>> extends object ? unknown : never) &
      ("_tag" extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
  ) => Guard<
    Guard.Input<G>,
    Guard.Output<G> & { readonly _tag: B },
    Guard.Error<G>,
    Guard.Services<G>
  >;

  <G extends GuardInput<any, any, any, any>, B>(
    guard: G &
      (NoInfer<Guard.Output<G>> extends object ? unknown : never) &
      ("_tag" extends NoInfer<
        Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never
      >
        ? never
        : unknown),
    value: B,
  ): Guard<
    Guard.Input<G>,
    Guard.Output<G> & { readonly _tag: B },
    Guard.Error<G>,
    Guard.Services<G>
  >;
} = dual(2, function attachProperty<
  I,
  O extends object,
  E,
  R,
  B,
>(guard: GuardInput<I, O, E, R>, value: B): Guard<I, O & { readonly _tag: B }, E, R> {
  return map(guard, (a) =>
    extendEnumerableRecord(assertObjectRecord(a), "_tag", value) as O & { readonly _tag: B },
  );
});

/**
 * Wraps any matched output in a new object under `key`. This is the explicit
 * transition from an arbitrary output to the record-building workflow.
 *
 * @since 1.0.0
 */
export const bindTo: {
  <K extends PropertyKey>(
    key: K,
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, { [k in K]: O }, E, R>;
  <I, O, E, R, K extends PropertyKey>(
    guard: GuardInput<I, O, E, R>,
    key: K,
  ): Guard<I, { [k in K]: O }, E, R>;
} = dual(
  2,
  <I, O, E, R, K extends PropertyKey>(
    guard: GuardInput<I, O, E, R>,
    key: K,
  ): Guard<I, { [k in K]: O }, E, R> => map(guard, (a) => ({ [key]: a }) as { [k in K]: O }),
);

/**
 * Runs `f` on a matched object and adds its matched value under a new key. The
 * key must not already exist. Enumerable getters and proxy traps may execute
 * during the object spread.
 *
 * @since 1.0.0
 */
export const bind: {
  <O extends object, K extends PropertyKey, B, E2, R2>(
    key: K,
    f: GuardInput<O, B, E2, R2>,
  ): <G extends GuardInput<any, O, any, any>>(
    guard: G &
      (K extends NoInfer<
        Guard.Output<G> extends infer A ? (A extends unknown ? keyof A : never) : never
      >
        ? never
        : unknown),
  ) => Guard<
    Guard.Input<G>,
    Guard.Output<G> & { [k in K]: B },
    Guard.Error<G> | E2,
    Guard.Services<G> | R2
  >;

  <G extends GuardInput<any, any, any, any>, K extends PropertyKey, B, E2, R2>(
    guard: G & (NoInfer<Guard.Output<G>> extends object ? unknown : never),
    key: Exclude<
      K,
      NoInfer<Guard.Output<G> extends infer O ? (O extends unknown ? keyof O : never) : never>
    >,
    f: GuardInput<NoInfer<Guard.Output<G>>, B, E2, R2>,
  ): Guard<
    Guard.Input<G>,
    Guard.Output<G> & { [k in K]: B },
    Guard.Error<G> | E2,
    Guard.Services<G> | R2
  >;
} = dual(3, function bind<
  I,
  O extends object,
  E,
  R,
  K extends PropertyKey,
  B,
  E2,
  R2,
>(guard: GuardInput<I, O, E, R>, key: K, f: GuardInput<O, B, E2, R2>): Guard<
  I,
  O & { [k in K]: B },
  E | E2,
  R | R2
> {
  const f_ = bindTo(f, key);
  return pipe(guard, (o) =>
    Effect.mapEager(
      invokeGuard(f_, o),
      Option.map(
        (b) =>
          mergeEnumerableRecords(assertObjectRecord(o), b as Record<PropertyKey, unknown>) as O & {
            [k in K]: B;
          },
      ),
    ),
  );
});
