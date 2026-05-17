import { Effect, Option } from "effect";
import type { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
import { parseAuthorizationHeader } from "../domain/Auth.js";
import type { OpaqueToken } from "../domain/Ids.js";
import type { ArticleListFilter } from "../infrastructure/repositories/ArticleRepository.js";

export interface RawApiContext<P extends Record<string, string> = Record<string, string>> {
  readonly params?: P;
  readonly request: HttpServerRequest;
}

export const authToken = (ctx: RawApiContext): Option.Option<OpaqueToken> =>
  parseAuthorizationHeader(
    ctx.request.headers.authorization ?? ctx.request.headers.Authorization,
  );

export const jsonBody = <A>(ctx: RawApiContext): Effect.Effect<A, unknown> =>
  ctx.request.json.pipe(Effect.map((body) => body as A));

export const pathParam = <P extends Record<string, string>>(
  ctx: RawApiContext<P>,
  key: keyof P,
): string => ctx.params?.[key] ?? "";

export const intPathParam = <P extends Record<string, string>>(
  ctx: RawApiContext<P>,
  key: keyof P,
): number => Number.parseInt(pathParam(ctx, key), 10);

export const articleFilter = (ctx: RawApiContext): ArticleListFilter => {
  const query = new URL(ctx.request.url, "http://localhost").searchParams;
  return compactFilter({
    tag: query.get("tag") ?? undefined,
    author: query.get("author") ?? undefined,
    favorited: query.get("favorited") ?? undefined,
    limit: toOptionalInt(query.get("limit")),
    offset: toOptionalInt(query.get("offset")),
  });
};

export const feedFilter = (ctx: RawApiContext): ArticleListFilter => {
  const query = new URL(ctx.request.url, "http://localhost").searchParams;
  return compactFilter({
    limit: toOptionalInt(query.get("limit")),
    offset: toOptionalInt(query.get("offset")),
  });
};

const compactFilter = (filter: ArticleListFilter): ArticleListFilter =>
  Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  ) as ArticleListFilter;

const toOptionalInt = (value: string | null): number | undefined => {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};
