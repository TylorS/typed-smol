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
import type {
  ArticleRepositoryError,
  CommentRepositoryError,
  UserRepositoryError,
} from "../domain/RepositoryErrors.js";
import { ArticleRepository } from "../infrastructure/repositories/ArticleRepository.js";
import type { ArticleRepositoryService } from "../infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "../infrastructure/repositories/CommentRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import { forbidden, notFound, optionalUserId, requireNonBlank, requireUser } from "./Common.js";

type CommentsError =
  | RealWorldError
  | ArticleRepositoryError
  | CommentRepositoryError
  | UserRepositoryError;

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
        create: Effect.fn(function* (
          token: Option.Option<OpaqueToken>,
          slug: string,
          input: CreateCommentRequest,
        ) {
          const user = yield* requireUser(token, users);
          const body = yield* requireNonBlank("body", input.comment.body);
          const comment = yield* comments.create(user.id, slug, body);
          return yield* toCommentResponse(comment);
        }),
        delete: Effect.fn(function* (
          token: Option.Option<OpaqueToken>,
          slug: string,
          commentId: number,
        ) {
          const user = yield* requireUser(token, users);
          const id = yield* decodeCommentId(commentId);
          yield* requireArticle(slug, articles);
          const owner = yield* comments.findOwnerId(id);
          if (Option.isNone(owner)) return yield* Effect.fail(notFound("comment"));
          if (owner.value !== user.id) return yield* Effect.fail(forbidden("comment"));
          yield* comments
            .delete(user.id, id)
            .pipe(Effect.catch(() => Effect.fail(notFound("comment"))));
        }),
        list: Effect.fn(function* (slug: string, token: Option.Option<OpaqueToken>) {
          const viewer = yield* optionalUserId(token, users);
          const articleComments = yield* comments.listByArticle(slug, viewer);
          if (Option.isNone(articleComments)) return yield* Effect.fail(notFound("article"));
          return { comments: articleComments.value };
        }),
      };
    }),
  );
}

const decodeCommentId = (id: number): Effect.Effect<CommentId, RealWorldError> =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknownEffect(CommentId)(id).pipe(Effect.option);
    if (Option.isNone(decoded)) return yield* Effect.fail(notFound("comment"));
    return decoded.value;
  });

const toCommentResponse = (comment: Option.Option<Comment>) =>
  Effect.gen(function* () {
    if (Option.isNone(comment)) return yield* Effect.fail(notFound("article"));
    return { comment: comment.value };
  });

const requireArticle = (slug: string, articles: ArticleRepositoryService) =>
  Effect.gen(function* () {
    const article = yield* articles.findBySlug(slug, Option.none());
    if (Option.isNone(article)) return yield* Effect.fail(notFound("article"));
  });
