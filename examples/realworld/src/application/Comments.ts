import { Context, Effect, Layer, Option } from "effect";
import * as Schema from "effect/Schema";
import type { Comment } from "../domain/Article.js";
import { CommentId, type OpaqueToken } from "../domain/Ids.js";
import type {
  CreateCommentRequest,
  MultipleCommentsResponse,
  SingleCommentResponse,
} from "../domain/RealWorldApi.js";
import type { RealWorldError } from "../domain/Errors.js";
import { ArticleRepository } from "../infrastructure/repositories/ArticleRepository.js";
import type {
  ArticleRepositoryError,
  ArticleRepositoryService,
} from "../infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "../infrastructure/repositories/CommentRepository.js";
import type { CommentRepositoryError } from "../infrastructure/repositories/CommentRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import type { UserRepositoryError } from "../infrastructure/repositories/UserRepository.js";
import {
  forbidden,
  notFound,
  optionalUserId,
  requireNonBlank,
  requireUser,
} from "./Common.js";

type CommentsError = RealWorldError | ArticleRepositoryError | CommentRepositoryError | UserRepositoryError;

export interface CommentsService {
  readonly create: (
    token: Option.Option<OpaqueToken>,
    slug: string,
    input: CreateCommentRequest,
  ) => Effect.Effect<SingleCommentResponse, CommentsError>;
  readonly delete: (
    token: Option.Option<OpaqueToken>,
    slug: string,
    commentId: number,
  ) => Effect.Effect<void, CommentsError>;
  readonly list: (
    slug: string,
    token: Option.Option<OpaqueToken>,
  ) => Effect.Effect<MultipleCommentsResponse, CommentsError>;
}

export class Comments extends Context.Service<Comments, CommentsService>()(
  "@typed/realworld/Comments",
) {
  static readonly Live = Layer.effect(
    Comments,
    Effect.gen(function* () {
      const articles = yield* ArticleRepository;
      const comments = yield* CommentRepository;
      const users = yield* UserRepository;

      return {
        create: (token, slug, input) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) =>
              requireNonBlank("body", input.comment.body).pipe(
                Effect.flatMap((body) => comments.create(user.id, slug, body)),
                Effect.flatMap(commentResponse),
              ),
            ),
          ),
        delete: (token, slug, commentId) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) =>
              decodeCommentId(commentId).pipe(
                Effect.flatMap((id) =>
                  requireArticle(slug, articles).pipe(
                    Effect.flatMap(() => comments.findOwnerId(id)),
                    Effect.flatMap((owner) => {
                      if (Option.isNone(owner)) return Effect.fail(notFound("comment"));
                      if (owner.value !== user.id) return Effect.fail(forbidden("comment"));
                      return comments.delete(user.id, id).pipe(
                        Effect.catch(() => Effect.fail(notFound("comment"))),
                        Effect.asVoid,
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        list: (slug, token) =>
          optionalUserId(token, users).pipe(
            Effect.flatMap((viewer) => comments.listByArticle(slug, viewer)),
            Effect.flatMap((comments) =>
              Option.isSome(comments)
                ? Effect.succeed({ comments: comments.value })
                : Effect.fail(notFound("article")),
            ),
          ),
      };
    }),
  );
}

const decodeCommentId = (id: number) =>
  Schema.decodeUnknownEffect(CommentId)(id).pipe(
    Effect.catch(() => Effect.fail(notFound("comment"))),
  );

const commentResponse = (comment: Option.Option<Comment>) =>
  Option.isSome(comment)
    ? Effect.succeed({ comment: comment.value })
    : Effect.fail(notFound("article"));

const requireArticle = (slug: string, articles: ArticleRepositoryService) =>
  articles.findBySlug(slug, Option.none()).pipe(
    Effect.flatMap((article) =>
      Option.isSome(article) ? Effect.void : Effect.fail(notFound("article")),
    ),
  );
