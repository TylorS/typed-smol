import { Context, Effect, Layer, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { Comment } from "../../domain/Article.js";
import { CommentId, Slug, UserId } from "../../domain/Ids.js";
import { type CommentRepositoryError } from "../../domain/RepositoryErrors.js";
import { Profile } from "../../domain/User.js";
import {
  currentIsoTimestamp,
  first,
  provideRepositorySql,
} from "./Common.js";

export interface CommentRepositoryService {
  readonly create: (
    authorId: UserId,
    slug: string,
    body: string,
  ) => Effect.Effect<Option.Option<Comment>, CommentRepositoryError>;
  readonly delete: (
    authorId: UserId,
    commentId: CommentId,
  ) => Effect.Effect<boolean, CommentRepositoryError>;
  readonly findOwnerId: (
    commentId: CommentId,
  ) => Effect.Effect<Option.Option<UserId>, CommentRepositoryError>;
  readonly listByArticle: (
    slug: string,
    viewerId: Option.Option<UserId>,
  ) => Effect.Effect<Option.Option<readonly Comment[]>, CommentRepositoryError>;
}

export class CommentRepository extends Context.Service<
  CommentRepository,
  CommentRepositoryService
>()("@typed/realworld/CommentRepository") {
  static readonly Live = Layer.effect(
    CommentRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      return {
        create: (authorId, slug, body) =>
          provideRepositorySql(createComment(authorId, slug, body), sql),
        delete: (authorId, commentId) =>
          provideRepositorySql(deleteComment(authorId, commentId), sql),
        findOwnerId: (commentId) => provideRepositorySql(findOwnerId(commentId), sql),
        listByArticle: (slug, viewerId) => provideRepositorySql(listByArticle(slug, viewerId), sql),
      };
    }),
  );
}

interface CommentRow {
  readonly id: number;
  readonly body: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly author_username: string;
  readonly author_bio: string | null;
  readonly author_image: string | null;
  readonly author_following: number;
}

const createComment = (
  authorId: UserId,
  rawSlug: string,
  body: string,
): Effect.Effect<Option.Option<Comment>, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const articleId = yield* selectArticleId(slug);
    if (Option.isNone(articleId)) return Option.none();

    const sql = yield* SqlClient.SqlClient;
    const now = currentIsoTimestamp();
    const [row] = yield* sql<{ readonly id: number }>`
      INSERT INTO comments (article_id, author_id, body, created_at, updated_at)
      VALUES (${articleId.value}, ${authorId}, ${body}, ${now}, ${now})
      RETURNING id
    `;
    const commentId = yield* Schema.decodeUnknownEffect(CommentId)(row.id);

    return yield* findById(commentId, Option.some(authorId));
  });

const listByArticle = (
  rawSlug: string,
  viewerId: Option.Option<UserId>,
): Effect.Effect<Option.Option<readonly Comment[]>, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const articleId = yield* selectArticleId(slug);
    if (Option.isNone(articleId)) return Option.none();

    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<CommentRow>`
      SELECT ${commentColumns(sql, Option.getOrUndefined(viewerId) ?? 0)}
      FROM comments
      INNER JOIN users ON users.id = comments.author_id
      WHERE comments.article_id = ${articleId.value}
      ORDER BY comments.created_at ASC, comments.id ASC
    `;
    const comments = yield* Effect.forEach(rows, toComment);

    return Option.some(comments);
  });

const deleteComment = (
  authorId: UserId,
  commentId: CommentId,
): Effect.Effect<boolean, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const owner = yield* findOwnerId(commentId);
    if (Option.isNone(owner) || owner.value !== authorId) return false;

    const sql = yield* SqlClient.SqlClient;
    yield* sql`DELETE FROM comments WHERE id = ${commentId}`;
    return true;
  });

const findById = (
  commentId: CommentId,
  viewerId: Option.Option<UserId>,
): Effect.Effect<Option.Option<Comment>, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<CommentRow>`
      SELECT ${commentColumns(sql, Option.getOrUndefined(viewerId) ?? 0)}
      FROM comments
      INNER JOIN users ON users.id = comments.author_id
      WHERE comments.id = ${commentId}
      LIMIT 1
    `;

    return yield* decodeCommentOption(first(rows));
  });

const findOwnerId = (
  commentId: CommentId,
): Effect.Effect<Option.Option<UserId>, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly author_id: number }>`
      SELECT author_id FROM comments WHERE id = ${commentId} LIMIT 1
    `;
    const row = first(rows);
    if (Option.isNone(row)) return Option.none();

    const userId = yield* Schema.decodeUnknownEffect(UserId)(row.value.author_id);
    return Option.some(userId);
  });

const selectArticleId = (
  slug: Slug,
): Effect.Effect<Option.Option<number>, CommentRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly id: number }>`
      SELECT id FROM articles WHERE slug = ${slug} LIMIT 1
    `;

    return Option.map(first(rows), (row) => row.id);
  });

const commentColumns = (sql: SqlClient.SqlClient, viewerId: number) => sql`
  comments.id,
  comments.body,
  comments.created_at,
  comments.updated_at,
  users.username AS author_username,
  users.bio AS author_bio,
  users.image AS author_image,
  EXISTS(
    SELECT 1 FROM follows
    WHERE follows.follower_id = ${viewerId} AND follows.followed_id = users.id
  ) AS author_following
`;

const toComment = (row: CommentRow): Effect.Effect<Comment, Schema.SchemaError> =>
  Effect.gen(function* () {
    const author = yield* toAuthorProfile(row);
    return yield* Schema.decodeUnknownEffect(Comment)({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author,
    });
  });

const toAuthorProfile = (row: CommentRow): Effect.Effect<Profile, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(Profile)({
    username: row.author_username,
    bio: row.author_bio,
    image: row.author_image,
    following: Boolean(row.author_following),
  });

const decodeCommentOption = (
  row: Option.Option<CommentRow>,
): Effect.Effect<Option.Option<Comment>, Schema.SchemaError> =>
  Option.isSome(row)
    ? Effect.map(toComment(row.value), Option.some)
    : Effect.succeed(Option.none());
