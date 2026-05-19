import { Option } from "effect";
import * as Schema from "effect/Schema";
import { parseAuthorizationHeader } from "../domain/Auth.js";
import type { OpaqueToken } from "../domain/Ids.js";
import type { ArticleListFilter } from "../infrastructure/repositories/ArticleRepository.js";

export const RequestHeaders = Schema.Record(Schema.String, Schema.String);

export const HttpMethod = {
  Delete: "DELETE",
  Get: "GET",
  Post: "POST",
  Put: "PUT",
} as const;

export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

export const authToken = (headers?: Record<string, string>): Option.Option<OpaqueToken> =>
  parseAuthorizationHeader(headers?.authorization ?? headers?.Authorization);

export const articleFilter = (query: ArticleQuery): ArticleListFilter =>
  compactFilter({
    tag: query.tag,
    author: query.author,
    favorited: query.favorited,
    limit: toOptionalInt(query.limit),
    offset: toOptionalInt(query.offset),
  });

export const feedFilter = (query: FeedQuery): ArticleListFilter =>
  compactFilter({
    limit: toOptionalInt(query.limit),
    offset: toOptionalInt(query.offset),
  });

type ArticleQuery = {
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: string;
  readonly offset?: string;
  readonly tag?: string;
};

type FeedQuery = {
  readonly limit?: string;
  readonly offset?: string;
};

const compactFilter = (filter: ArticleListFilter): ArticleListFilter => {
  return {
    ...(filter.tag !== undefined && filter.tag !== "" ? { tag: filter.tag } : {}),
    ...(filter.author !== undefined && filter.author !== "" ? { author: filter.author } : {}),
    ...(filter.favorited !== undefined && filter.favorited !== "" ? { favorited: filter.favorited } : {}),
    ...(filter.limit !== undefined ? { limit: filter.limit } : {}),
    ...(filter.offset !== undefined ? { offset: filter.offset } : {}),
  };
};

const toOptionalInt = (value: string | undefined): number | undefined => {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};
