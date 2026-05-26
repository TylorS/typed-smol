import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type * as Schema from "effect/Schema";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";
import type { ArticlesService } from "../application/Articles.js";
import type { CommentsService } from "../application/Comments.js";
import type { ProfilesService } from "../application/Profiles.js";
import type { TagsService } from "../application/Tags.js";
import type { Article, ArticlePreview, Comment } from "../domain/Article.js";
import type { ErrorResponse } from "../domain/Errors.js";
import type {
  MultipleArticlesResponse,
  MultipleCommentsResponse,
  ProfileResponse,
  SingleArticleResponse,
  TagsResponse,
} from "../domain/RealWorldApi.js";
import type { Profile } from "../domain/User.js";

export type RouteApiClient<E = RouteApiError, R = never> = {
  readonly articles: {
    readonly get: (
      request: ApiRequest<{ readonly slug: string }>,
    ) => ApiEffect<SingleArticleResponse, E, R>;
    readonly list: (
      request: ApiRequest<{}, ArticleListQuery>,
    ) => ApiEffect<MultipleArticlesResponse, E, R>;
  };
  readonly comments: {
    readonly list: (
      request: ApiRequest<{ readonly slug: string }>,
    ) => ApiEffect<MultipleCommentsResponse, E, R>;
  };
  readonly profiles: {
    readonly get: (
      request: ApiRequest<{ readonly username: string }>,
    ) => ApiEffect<ProfileResponse, E, R>;
  };
  readonly tags: {
    readonly list: (request: ApiRequest) => ApiEffect<TagsResponse, E, R>;
  };
};

export class ApiClient extends Context.Service<ApiClient, RouteApiClient>()("RealWorld/ApiClient") {
  static readonly layer = <R2>(
    client: Effect.Effect<RouteApiClient<RouteApiError>, never, R2>,
  ): Layer.Layer<ApiClient, never, R2> => Layer.effect(ApiClient, client);
}

export interface FeedViewData {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}

export interface ArticleViewData {
  readonly article: Article;
  readonly comments: readonly Comment[];
}

export interface ProfileViewData {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}

type ApiRequest<Params = {}, Query = {}> = {
  readonly params: Params;
  readonly query: Query;
  readonly headers: Readonly<Record<string, string>>;
};

type ArticleListQuery = {
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly tag?: string;
};

type WireArticleListQuery = Omit<ArticleListQuery, "limit" | "offset"> & {
  readonly limit?: string;
  readonly offset?: string;
};

type MethodError<Method> = Method extends (
  ...args: ReadonlyArray<any>
) => Effect.Effect<any, infer Error, any>
  ? Error
  : never;

type DecodedResponseRequest = {
  readonly responseMode?: "decoded-only";
};

type RouteApiDecoderArticlesGet<E = RouteApiDecoderError, R = never> = (
  request: ApiRequest<{ readonly slug: string }> & DecodedResponseRequest,
) => Effect.Effect<SingleArticleResponse, E, R>;

type RouteApiDecoderArticlesList<E = RouteApiDecoderError, R = never> = (
  request: ApiRequest<{}, WireArticleListQuery> & DecodedResponseRequest,
) => Effect.Effect<MultipleArticlesResponse, E, R>;

type RouteApiDecoderCommentsList<E = RouteApiDecoderError, R = never> = (
  request: ApiRequest<{ readonly slug: string }> & DecodedResponseRequest,
) => Effect.Effect<MultipleCommentsResponse, E, R>;

type RouteApiDecoderProfilesGet<E = RouteApiDecoderError, R = never> = (
  request: ApiRequest<{ readonly username: string }> & DecodedResponseRequest,
) => Effect.Effect<ProfileResponse, E, R>;

type RouteApiDecoderTagsList<E = RouteApiDecoderError, R = never> = (
  request: ApiRequest & DecodedResponseRequest,
) => Effect.Effect<TagsResponse, E, R>;

type RouteApiDecoderError = HttpClientError.HttpClientError | Schema.SchemaError | ErrorResponse;

type RouteApiError =
  | RouteApiDecoderError
  | MethodError<RouteApiDecoderArticlesGet>
  | MethodError<RouteApiDecoderArticlesList>
  | MethodError<RouteApiDecoderCommentsList>
  | MethodError<RouteApiDecoderProfilesGet>
  | MethodError<RouteApiDecoderTagsList>
  | Effect.Error<ReturnType<ArticlesService["get"]>>
  | Effect.Error<ReturnType<ArticlesService["list"]>>
  | Effect.Error<ReturnType<CommentsService["list"]>>
  | Effect.Error<ReturnType<ProfilesService["get"]>>
  | Effect.Error<ReturnType<TagsService["list"]>>;

type ApiEffect<A, E = RouteApiError, R = never> = Effect.Effect<A, E, R>;

export type RouteApiClientDecoderInput<E = RouteApiDecoderError, R = never> = {
  readonly articles: {
    readonly get: RouteApiDecoderArticlesGet<E, R>;
    readonly list: RouteApiDecoderArticlesList<E, R>;
  };
  readonly comments: {
    readonly list: RouteApiDecoderCommentsList<E, R>;
  };
  readonly profiles: {
    readonly get: RouteApiDecoderProfilesGet<E, R>;
  };
  readonly tags: {
    readonly list: RouteApiDecoderTagsList<E, R>;
  };
};

export const decodedRouteApiClient = <E, R>(
  client: RouteApiClientDecoderInput<E, R>,
): RouteApiClient<E, R> => ({
  articles: {
    get: (request) => client.articles.get({ ...request, responseMode: "decoded-only" }),
    list: (request) =>
      client.articles.list({
        ...request,
        query: encodeArticleListQuery(request.query),
        responseMode: "decoded-only",
      }),
  },
  comments: {
    list: (request) => client.comments.list({ ...request, responseMode: "decoded-only" }),
  },
  profiles: {
    get: (request) => client.profiles.get({ ...request, responseMode: "decoded-only" }),
  },
  tags: {
    list: (request) => client.tags.list({ ...request, responseMode: "decoded-only" }),
  },
});

const encodeArticleListQuery = (query: ArticleListQuery): WireArticleListQuery => ({
  author: query.author,
  favorited: query.favorited,
  tag: query.tag,
  limit: query.limit === undefined ? undefined : String(query.limit),
  offset: query.offset === undefined ? undefined : String(query.offset),
});

export const home = Effect.fn(function* (
  client: RouteApiClient,
  { page }: { readonly page: number },
) {
  const { response, tagList } = yield* Effect.all(
    {
      response: client.articles.list({
        params: {},
        query: pageFilter(page),
        headers: {},
      }),
      tagList: client.tags.list({ params: {}, query: {}, headers: {} }),
    },
    { concurrency: "unbounded" },
  );
  const data: FeedViewData = { ...response, tags: tagList.tags, page };
  return data;
});

export const tag = Effect.fn(function* (
  client: RouteApiClient,
  { page, tag }: { readonly page: number; readonly tag: string },
) {
  const { response, tagList } = yield* Effect.all(
    {
      response: client.articles.list({
        params: {},
        query: { ...pageFilter(page), tag },
        headers: {},
      }),
      tagList: client.tags.list({ params: {}, query: {}, headers: {} }),
    },
    { concurrency: "unbounded" },
  );
  const data: FeedViewData = { ...response, tags: tagList.tags, page, selectedTag: tag };
  return data;
});

export const article = Effect.fn(function* (
  client: RouteApiClient,
  { slug }: { readonly slug: string },
) {
  const { article, commentList } = yield* Effect.all(
    {
      article: client.articles.get({ params: { slug }, query: {}, headers: {} }),
      commentList: client.comments.list({ params: { slug }, query: {}, headers: {} }),
    },
    { concurrency: "unbounded" },
  );
  return { article: article.article, comments: commentList.comments };
});

export const profile = Effect.fn(function* (
  client: RouteApiClient,
  { favorites, username }: { readonly favorites: boolean; readonly username: string },
) {
  const { profile, feed } = yield* Effect.all(
    {
      profile: client.profiles.get({ params: { username }, query: {}, headers: {} }),
      feed: client.articles.list({
        params: {},
        query: favorites
          ? { favorited: username, limit: pageSize }
          : { author: username, limit: pageSize },
        headers: {},
      }),
    },
    { concurrency: "unbounded" },
  );
  return { profile: profile.profile, ...feed, favorites };
});

const pageSize = 10;

const pageFilter = (page: number) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize,
});
