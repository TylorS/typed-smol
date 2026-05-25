import { Context, Effect, Layer, Option } from "effect";
import type { Article } from "../domain/Article.js";
import type { OpaqueToken } from "../domain/Ids.js";
import type {
  CreateArticleRequest,
  MultipleArticlesResponse,
  SingleArticleResponse,
  UpdateArticleRequest,
} from "../domain/RealWorldApi.js";
import type { RealWorldError } from "../domain/Errors.js";
import type { ArticleRepositoryError, UserRepositoryError } from "../domain/RepositoryErrors.js";
import { ArticleRepository } from "../infrastructure/repositories/ArticleRepository.js";
import type {
  CreateArticleInput,
  ArticleListFilter,
  ArticleRepositoryService,
  UpdateArticleInput,
} from "../infrastructure/repositories/ArticleRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import type { UserRepositoryService } from "../infrastructure/repositories/UserRepository.js";
import {
  forbidden,
  notFound,
  optionalUserId,
  requireNonBlank,
  requireUser,
  validationError,
} from "./Common.js";

type ArticlesError = RealWorldError | ArticleRepositoryError | UserRepositoryError;

export interface ArticlesService {
  readonly create: (
    token: Option.Option<OpaqueToken>,
    input: CreateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
  readonly delete: (
    token: Option.Option<OpaqueToken>,
    slug: string,
  ) => Effect.Effect<void, ArticlesError>;
  readonly favorite: (
    token: Option.Option<OpaqueToken>,
    slug: string,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
  readonly feed: (
    token: Option.Option<OpaqueToken>,
    filter: ArticleListFilter,
  ) => Effect.Effect<MultipleArticlesResponse, ArticlesError>;
  readonly get: (
    token: Option.Option<OpaqueToken>,
    slug: string,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
  readonly list: (
    filter: ArticleListFilter,
    token: Option.Option<OpaqueToken>,
  ) => Effect.Effect<MultipleArticlesResponse, ArticlesError>;
  readonly unfavorite: (
    token: Option.Option<OpaqueToken>,
    slug: string,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
  readonly update: (
    token: Option.Option<OpaqueToken>,
    slug: string,
    input: UpdateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
}

export class Articles extends Context.Service<Articles, ArticlesService>()(
  "@typed/realworld/Articles",
) {
  static readonly Live = Layer.effect(
    Articles,
    Effect.gen(function* () {
      const articles = yield* ArticleRepository;
      const users = yield* UserRepository;

      return {
        create: Effect.fn(function* (
          token: Option.Option<OpaqueToken>,
          input: CreateArticleRequest,
        ) {
          const user = yield* requireUser(token, users);
          const article = yield* validateCreate(input);
          const created = yield* articles.create(user.id, article);
          return { article: created };
        }),
        delete: Effect.fn(function* (token: Option.Option<OpaqueToken>, slug: string) {
          const user = yield* requireAuthor(token, slug, users, articles);
          const deleted = yield* articles.delete(user.id, slug);
          if (!deleted) return yield* Effect.fail(notFound("article"));
        }),
        favorite: Effect.fn(function* (token: Option.Option<OpaqueToken>, slug: string) {
          const user = yield* requireUser(token, users);
          const article = yield* articles.favorite(user.id, slug);
          return yield* toArticleResponse("article", article);
        }),
        feed: Effect.fn(function* (token: Option.Option<OpaqueToken>, filter: ArticleListFilter) {
          const user = yield* requireUser(token, users);
          return yield* articles.feed(user.id, filter);
        }),
        get: Effect.fn(function* (token: Option.Option<OpaqueToken>, slug: string) {
          const viewer = yield* optionalUserId(token, users);
          const article = yield* articles.findBySlug(slug, viewer);
          return yield* toArticleResponse("article", article);
        }),
        list: Effect.fn(function* (filter: ArticleListFilter, token: Option.Option<OpaqueToken>) {
          const viewer = yield* optionalUserId(token, users);
          return yield* articles.list(filter, viewer);
        }),
        unfavorite: Effect.fn(function* (token: Option.Option<OpaqueToken>, slug: string) {
          const user = yield* requireUser(token, users);
          const article = yield* articles.unfavorite(user.id, slug);
          return yield* toArticleResponse("article", article);
        }),
        update: Effect.fn(function* (
          token: Option.Option<OpaqueToken>,
          slug: string,
          input: UpdateArticleRequest,
        ) {
          const user = yield* requireAuthor(token, slug, users, articles);
          const article = yield* validateUpdate(input);
          const updated = yield* articles.update(user.id, slug, article);
          return yield* toArticleResponse("article", updated);
        }),
      };
    }),
  );
}

const toArticleResponse = (field: string, article: Option.Option<Article>) =>
  Effect.gen(function* () {
    if (Option.isNone(article)) return yield* Effect.fail(notFound(field));
    return { article: article.value };
  });

const requireAuthor = (
  token: Option.Option<OpaqueToken>,
  slug: string,
  users: UserRepositoryService,
  articles: ArticleRepositoryService,
) =>
  Effect.gen(function* () {
    const user = yield* requireUser(token, users);
    const owner = yield* articles.findOwnerIdBySlug(slug);
    if (Option.isNone(owner)) return yield* Effect.fail(notFound("article"));
    if (owner.value !== user.id) return yield* Effect.fail(forbidden("article"));
    return user;
  });

const validateCreate = (
  input: CreateArticleRequest,
): Effect.Effect<CreateArticleInput, RealWorldError> =>
  Effect.gen(function* () {
    yield* requireNonBlank("title", input.article.title);
    yield* requireNonBlank("description", input.article.description);
    yield* requireNonBlank("body", input.article.body);
    if (input.article.tagList === null) return yield* Effect.fail(validationError("tagList"));
    return {
      title: input.article.title,
      description: input.article.description,
      body: input.article.body,
      ...(input.article.tagList === undefined ? {} : { tagList: input.article.tagList }),
    };
  });

const validateUpdate = (
  input: UpdateArticleRequest,
): Effect.Effect<UpdateArticleInput, RealWorldError> =>
  Effect.gen(function* () {
    if (input.article.title !== undefined) {
      yield* requireNonBlank("title", input.article.title);
    }
    if (input.article.description !== undefined) {
      yield* requireNonBlank("description", input.article.description);
    }
    if (input.article.body !== undefined) {
      yield* requireNonBlank("body", input.article.body);
    }
    if (input.article.tagList === null) return yield* Effect.fail(validationError("tagList"));

    return {
      ...(input.article.title === undefined ? {} : { title: input.article.title }),
      ...(input.article.description === undefined
        ? {}
        : { description: input.article.description }),
      ...(input.article.body === undefined ? {} : { body: input.article.body }),
      ...(input.article.tagList === undefined ? {} : { tagList: input.article.tagList }),
    };
  });
