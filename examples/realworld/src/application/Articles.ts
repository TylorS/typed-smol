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
import { ArticleRepository } from "../infrastructure/repositories/ArticleRepository.js";
import type {
  ArticleListFilter,
  ArticleRepositoryError,
  ArticleRepositoryService,
} from "../infrastructure/repositories/ArticleRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import type {
  UserRepositoryError,
  UserRepositoryService,
} from "../infrastructure/repositories/UserRepository.js";
import {
  forbidden,
  notFound,
  optionalUserId,
  requireNonBlank,
  requireUser,
} from "./Common.js";

type ArticlesError = RealWorldError | ArticleRepositoryError | UserRepositoryError;

export interface ArticlesService {
  readonly create: (
    token: Option.Option<OpaqueToken>,
    input: CreateArticleRequest,
  ) => Effect.Effect<SingleArticleResponse, ArticlesError>;
  readonly delete: (token: Option.Option<OpaqueToken>, slug: string) => Effect.Effect<void, ArticlesError>;
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
        create: (token, input) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) =>
              validateCreate(input).pipe(
                Effect.flatMap((article) => articles.create(user.id, article)),
                Effect.map((article) => ({ article })),
              ),
            ),
          ),
        delete: (token, slug) =>
          requireAuthor(token, slug, users, articles).pipe(
            Effect.flatMap((user) => articles.delete(user.id, slug)),
            Effect.flatMap((deleted) =>
              deleted ? Effect.void : Effect.fail(notFound("article")),
            ),
          ),
        favorite: (token, slug) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) => articles.favorite(user.id, slug)),
            Effect.flatMap(articleResponse("article")),
          ),
        feed: (token, filter) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) => articles.feed(user.id, filter)),
          ),
        get: (token, slug) =>
          optionalUserId(token, users).pipe(
            Effect.flatMap((viewer) => articles.findBySlug(slug, viewer)),
            Effect.flatMap(articleResponse("article")),
          ),
        list: (filter, token) =>
          optionalUserId(token, users).pipe(
            Effect.flatMap((viewer) => articles.list(filter, viewer)),
          ),
        unfavorite: (token, slug) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) => articles.unfavorite(user.id, slug)),
            Effect.flatMap(articleResponse("article")),
          ),
        update: (token, slug, input) =>
          requireAuthor(token, slug, users, articles).pipe(
            Effect.flatMap((user) =>
              validateUpdate(input).pipe(
                Effect.flatMap((article) => articles.update(user.id, slug, article)),
                Effect.flatMap(articleResponse("article")),
              ),
            ),
          ),
      };
    }),
  );
}

const articleResponse = (field: string) => (article: Option.Option<Article>) =>
  Option.isSome(article)
    ? Effect.succeed({ article: article.value })
    : Effect.fail(notFound(field));

const requireAuthor = (
  token: Option.Option<OpaqueToken>,
  slug: string,
  users: UserRepositoryService,
  articles: ArticleRepositoryService,
) =>
  requireUser(token, users).pipe(
    Effect.flatMap((user) =>
      articles.findOwnerIdBySlug(slug).pipe(
        Effect.flatMap((owner) => {
          if (Option.isNone(owner)) return Effect.fail(notFound("article"));
          return owner.value === user.id ? Effect.succeed(user) : Effect.fail(forbidden("article"));
        }),
      ),
    ),
  );

const validateCreate = (
  input: CreateArticleRequest,
): Effect.Effect<CreateArticleRequest["article"], RealWorldError> =>
  Effect.all([
    requireNonBlank("title", input.article.title),
    requireNonBlank("description", input.article.description),
    requireNonBlank("body", input.article.body),
  ]).pipe(Effect.as(input.article));

const validateUpdate = (
  input: UpdateArticleRequest,
): Effect.Effect<UpdateArticleRequest["article"], RealWorldError> =>
  input.article.title !== undefined
    ? requireNonBlank("title", input.article.title).pipe(Effect.as(input.article))
    : Effect.succeed(input.article);
