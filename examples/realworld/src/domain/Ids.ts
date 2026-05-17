import type { Brand } from "effect/Brand";
import { String as Str, pipe } from "effect";
import * as Schema from "effect/Schema";

export type { Brand };

export const NonEmptyString = Schema.String.pipe(Schema.check(Schema.isNonEmpty()));
export type NonEmptyString = Schema.Schema.Type<typeof NonEmptyString>;

export const NonNegativeInt = Schema.Number.pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
);
export type NonNegativeInt = Schema.Schema.Type<typeof NonNegativeInt>;

export const PositiveInt = Schema.Number.pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThan(0)),
);
export type PositiveInt = Schema.Schema.Type<typeof PositiveInt>;

export const IsoDateTimeString = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)),
  Schema.brand("IsoDateTimeString"),
);
export type IsoDateTimeString = Schema.Schema.Type<typeof IsoDateTimeString>;

export const UserId = PositiveInt.pipe(Schema.brand("UserId"));
export type UserId = Schema.Schema.Type<typeof UserId>;

export const ArticleId = PositiveInt.pipe(Schema.brand("ArticleId"));
export type ArticleId = Schema.Schema.Type<typeof ArticleId>;

export const CommentId = PositiveInt.pipe(Schema.brand("CommentId"));
export type CommentId = Schema.Schema.Type<typeof CommentId>;

export const SessionId = NonEmptyString.pipe(Schema.brand("SessionId"));
export type SessionId = Schema.Schema.Type<typeof SessionId>;

export const OpaqueToken = NonEmptyString.pipe(Schema.brand("OpaqueToken"));
export type OpaqueToken = Schema.Schema.Type<typeof OpaqueToken>;

export const Slug = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  Schema.brand("Slug"),
);
export type Slug = Schema.Schema.Type<typeof Slug>;

export const Username = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[A-Za-z0-9_][A-Za-z0-9_-]*$/)),
  Schema.brand("Username"),
);
export type Username = Schema.Schema.Type<typeof Username>;

export const Email = NonEmptyString.pipe(
  Schema.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  Schema.brand("Email"),
);
export type Email = Schema.Schema.Type<typeof Email>;

export const TagName = NonEmptyString.pipe(Schema.brand("TagName"));
export type TagName = Schema.Schema.Type<typeof TagName>;

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

export const uniqueSlug = (
  title: string,
  existingSlugs: Iterable<string>,
): string => {
  const base = toSlugBase(title);
  const existing = new Set(existingSlugs);
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
};
