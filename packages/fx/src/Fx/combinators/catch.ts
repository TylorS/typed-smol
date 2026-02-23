import type * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import * as Result from "effect/Result";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

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

/**
 * Recovers from a typed failure of an Fx by switching to a fallback Fx.
 *
 * Mirrors `Effect.catch` / `Effect.catchAll` (catches `Cause.Fail` only).
 *
 * @since 1.0.0
 * @category combinators
 */
export const catch_: {
  <E, A2, E2, R2>(f: (e: E) => Fx<A2, E2, R2>): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E2, R | R2>;

  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, f: (e: E) => Fx<A2, E2, R2>): Fx<A | A2, E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, f: (e: E) => Fx<A2, E2, R2>): Fx<A | A2, E2, R | R2> =>
    make<A | A2, E2, R | R2>((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          }
          return f(result.success.error).run(sink);
        }, sink.onSuccess),
      ),
    ),
);

export { catch_ as catch };

/**
 * An alias for {@link catch}.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchAll = catch_;

/**
 * Recovers from *any* failure cause of an Fx (including defects and interrupts)
 * by switching to a fallback Fx.
 *
 * Mirrors `Effect.catchCause`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchCause: {
  <E, A2, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E2, R | R2> =>
    make<A | A2, E2, R | R2>((sink) =>
      self.run(makeSink((cause) => f(cause).run(sink), sink.onSuccess)),
    ),
);

/**
 * Recovers from a typed failure by matching on the `_tag` field of the error.
 *
 * Mirrors `Effect.catchTag`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchTag: {
  <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, A2, E2, R2>(
    k: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): <A, R>(
    self: Fx<A, E, R>,
  ) => Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, A2, E2, R2>(
    self: Fx<A, E, R>,
    k: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;
} = dual(
  3,
  <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, A2, E2, R2>(
    self: Fx<A, E, R>,
    k: K,
    f: (
      e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx<A2, E2, R2>,
  ): Fx<
    A | A2,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > =>
    make<
      A | A2,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          } else if (matchesTag(k, result.success.error)) {
            return f(
              result.success.error as ExtractTag<
                E,
                K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
              >,
            ).run(sink);
          } else {
            return sink.onFailure(
              cause as Cause.Cause<
                E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>
              >,
            );
          }
        }, sink.onSuccess),
      ),
    ),
);

/**
 * Recovers from a typed failure when a predicate holds, by switching to a fallback Fx.
 * Only applies to `Cause.Fail`; defects and interrupts are not caught.
 *
 * Mirrors `Effect.catchIf`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchIf: {
  <E, A2, E2, R2>(
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (e: E) => boolean,
    f: (e: E) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2> =>
    make<A | A2, E | E2, R | R2>((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          }
          const error = result.success.error;
          if (predicate(error)) {
            return f(error).run(sink);
          }
          return sink.onFailure(cause);
        }, sink.onSuccess),
      ),
    ),
);

/**
 * Recovers from a failure cause when a predicate on the cause holds,
 * by switching to a fallback Fx.
 *
 * Mirrors `Effect.catchCauseIf`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchCauseIf: {
  <E, A2, E2, R2>(
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;

  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2>;
} = dual(
  3,
  <A, E, R, A2, E2, R2>(
    self: Fx<A, E, R>,
    predicate: (cause: Cause.Cause<E>) => boolean,
    f: (cause: Cause.Cause<E>) => Fx<A2, E2, R2>,
  ): Fx<A | A2, E | E2, R | R2> =>
    make<A | A2, E | E2, R | R2>((sink) =>
      self.run(
        makeSink(
          (cause) => (predicate(cause) ? f(cause).run(sink) : sink.onFailure(cause)),
          sink.onSuccess,
        ),
      ),
    ),
);

type TaggedCase<E, Cases> = {
  [K in Extract<E, { _tag: string }>["_tag"]]+?: (
    error: Extract<E, { _tag: K }>,
  ) => Fx<unknown, unknown, unknown>;
};

/**
 * Recovers from typed failures by matching on the `_tag` field with multiple handlers at once.
 *
 * Mirrors `Effect.catchTags`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const catchTags: {
  <E, Cases extends TaggedCase<E, Cases>>(
    cases: Cases,
  ): <A, R>(
    self: Fx<A, E, R>,
  ) => Fx<
    | A
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<infer A2, unknown, unknown>
          ? A2
          : never;
      }[keyof Cases],
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, infer E2, unknown>
          ? E2
          : never;
      }[keyof Cases],
    | R
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, unknown, infer R2>
          ? R2
          : never;
      }[keyof Cases]
  >;

  <A, E, R, Cases extends TaggedCase<E, Cases>>(
    self: Fx<A, E, R>,
    cases: Cases,
  ): Fx<
    | A
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<infer A2, unknown, unknown>
          ? A2
          : never;
      }[keyof Cases],
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, infer E2, unknown>
          ? E2
          : never;
      }[keyof Cases],
    | R
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, unknown, infer R2>
          ? R2
          : never;
      }[keyof Cases]
  >;
} = dual(
  2,
  <A, E, R, Cases extends TaggedCase<E, Cases>>(
    self: Fx<A, E, R>,
    cases: Cases,
  ): Fx<
    | A
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<infer A2, unknown, unknown>
          ? A2
          : never;
      }[keyof Cases],
    | Exclude<E, { _tag: keyof Cases }>
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, infer E2, unknown>
          ? E2
          : never;
      }[keyof Cases],
    | R
    | {
        [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, unknown, infer R2>
          ? R2
          : never;
      }[keyof Cases]
  > =>
    make<
      | A
      | {
          [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<infer A2, unknown, unknown>
            ? A2
            : never;
        }[keyof Cases],
      | Exclude<E, { _tag: keyof Cases }>
      | {
          [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, infer E2, unknown>
            ? E2
            : never;
        }[keyof Cases],
      | R
      | {
          [K in keyof Cases]: Cases[K] extends (e: unknown) => Fx<unknown, unknown, infer R2>
            ? R2
            : never;
        }[keyof Cases]
    >((sink) =>
      self.run(
        makeSink((cause) => {
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return sink.onFailure(result.failure);
          }
          const error = result.success.error as E;
          if (!hasTag(error)) {
            return sink.onFailure(cause);
          }
          const tag = (error as { _tag: string })._tag;
          const handler = (cases as Record<string, (e: unknown) => Fx<unknown, unknown, unknown>>)[
            tag
          ];
          if (handler !== undefined) {
            return handler(error).run(sink);
          }
          return sink.onFailure(cause);
        }, sink.onSuccess),
      ),
    ),
);
