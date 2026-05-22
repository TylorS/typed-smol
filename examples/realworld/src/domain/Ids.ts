import type { Brand } from "effect/Brand";
import { String as Str, pipe } from "effect";
import * as Schema from "effect/Schema";

export type { Brand };

export const NonEmptyString = Schema.String.pipe(Schema.check(Schema.isNonEmpty()));
export type NonEmptyString = typeof NonEmptyString.Type;

export const NonNegativeInt = Schema.Number.pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
);
export type NonNegativeInt = typeof NonNegativeInt.Type;

export const PositiveInt = Schema.Number.pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThan(0)),
);
export type PositiveInt = typeof PositiveInt.Type;

export const IsoDateTimeString = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)),
  Schema.brand("IsoDateTimeString"),
);
export type IsoDateTimeString = typeof IsoDateTimeString.Type;

export const UserId = PositiveInt.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const ArticleId = PositiveInt.pipe(Schema.brand("ArticleId"));
export type ArticleId = typeof ArticleId.Type;

export const CommentId = PositiveInt.pipe(Schema.brand("CommentId"));
export type CommentId = typeof CommentId.Type;

export const SessionId = NonEmptyString.pipe(Schema.brand("SessionId"));
export type SessionId = typeof SessionId.Type;

export const OpaqueToken = NonEmptyString.pipe(Schema.brand("OpaqueToken"));
export type OpaqueToken = typeof OpaqueToken.Type;

export const Slug = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  Schema.brand("Slug"),
);
export type Slug = typeof Slug.Type;

export const Username = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[A-Za-z0-9_][A-Za-z0-9_-]*$/)),
  Schema.brand("Username"),
);
export type Username = typeof Username.Type;

export const Email = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  Schema.brand("Email"),
);
export type Email = typeof Email.Type;

export const TagName = NonEmptyString.pipe(Schema.brand("TagName"));
export type TagName = typeof TagName.Type;

export const toSlugBase = (title: string): string => {
  const slug = pipe(
    title,
    Str.trim,
    Str.toLowerCase,
    Str.replaceAll(/[^a-z0-9]+/g, "-"),
    Str.replaceAll(/^-+|-+$/g, ""),
  );

  return slug.length > 0 ? slug : "article";
};

export const uniqueSlug = (title: string, existingSlugs: Iterable<string>): string => {
  const base = toSlugBase(title);
  const existing = new Set(existingSlugs);
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
};
