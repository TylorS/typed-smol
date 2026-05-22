import * as Schema from "effect/Schema";
import { ArticleId, CommentId, IsoDateTimeString, NonNegativeInt, Slug, TagName } from "./Ids.js";
import { Profile } from "./User.js";

export const Tag = Schema.Struct({
  name: TagName,
});
export type Tag = Schema.Schema.Type<typeof Tag>;

const ArticlePreviewFields = {
  slug: Slug,
  title: Schema.String,
  description: Schema.String,
  tagList: Schema.Array(TagName),
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
  favorited: Schema.Boolean,
  favoritesCount: NonNegativeInt,
  author: Profile,
} as const;

export const Article = Schema.Struct({
  id: Schema.optionalKey(ArticleId),
  ...ArticlePreviewFields,
  body: Schema.String,
});
export type Article = Schema.Schema.Type<typeof Article>;

export const ArticlePreview = Schema.Struct(ArticlePreviewFields);
export type ArticlePreview = Schema.Schema.Type<typeof ArticlePreview>;

export const Comment = Schema.Struct({
  id: CommentId,
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
  body: Schema.String,
  author: Profile,
});
export type Comment = Schema.Schema.Type<typeof Comment>;

export const ArticleFilter = Schema.Struct({
  tag: Schema.optionalKey(TagName),
  author: Schema.optionalKey(Profile.fields.username),
  favorited: Schema.optionalKey(Profile.fields.username),
  limit: Schema.optionalKey(NonNegativeInt),
  offset: Schema.optionalKey(NonNegativeInt),
});
export type ArticleFilter = Schema.Schema.Type<typeof ArticleFilter>;

export const normalizeTagList = (tags: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

export const applyTagUpdate = (
  existing: readonly string[],
  update: readonly string[] | undefined,
): readonly string[] => (update === undefined ? [...existing] : normalizeTagList(update));

export const canEditArticle = (
  currentUsername: string | null | undefined,
  authorUsername: string,
): boolean => currentUsername === authorUsername;
