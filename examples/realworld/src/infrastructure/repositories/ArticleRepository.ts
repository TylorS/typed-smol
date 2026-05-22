import { Context, Effect, Layer, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { Article, ArticlePreview, normalizeTagList } from "../../domain/Article.js";
import {
  ArticleId,
  NonNegativeInt,
  Slug,
  TagName,
  UserId,
  Username,
  uniqueSlug,
} from "../../domain/Ids.js";
import { defaultLimit } from "../../domain/Pagination.js";
import { Profile } from "../../domain/User.js";
import {
  ArticleRepositoryInvariantError,
  type ArticleRepositoryError,
} from "../../domain/RepositoryErrors.js";
import {
  currentIsoTimestamp,
  first,
  provideRepositorySql,
} from "./Common.js";

export interface ArticleListResult {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
}

export interface ArticleListFilter {
  readonly tag?: string;
  readonly author?: string;
  readonly favorited?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CreateArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: readonly string[];
}

export interface UpdateArticleInput {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
  readonly tagList?: readonly string[];
}

export interface ArticleRepositoryService {
  readonly create: (
    authorId: UserId,
    input: CreateArticleInput,
  ) => Effect.Effect<Article, ArticleRepositoryError>;
  readonly delete: (
    authorId: UserId,
    slug: string,
  ) => Effect.Effect<boolean, ArticleRepositoryError>;
  readonly favorite: (
    userId: UserId,
    slug: string,
  ) => Effect.Effect<Option.Option<Article>, ArticleRepositoryError>;
  readonly feed: (
    userId: UserId,
    filter: ArticleListFilter,
  ) => Effect.Effect<ArticleListResult, ArticleRepositoryError>;
  readonly findBySlug: (
    slug: string,
    viewerId: Option.Option<UserId>,
  ) => Effect.Effect<Option.Option<Article>, ArticleRepositoryError>;
  readonly findOwnerIdBySlug: (
    slug: string,
  ) => Effect.Effect<Option.Option<UserId>, ArticleRepositoryError>;
  readonly list: (
    filter: ArticleListFilter,
    viewerId: Option.Option<UserId>,
  ) => Effect.Effect<ArticleListResult, ArticleRepositoryError>;
  readonly unfavorite: (
    userId: UserId,
    slug: string,
  ) => Effect.Effect<Option.Option<Article>, ArticleRepositoryError>;
  readonly update: (
    authorId: UserId,
    slug: string,
    input: UpdateArticleInput,
  ) => Effect.Effect<Option.Option<Article>, ArticleRepositoryError>;
}

export class ArticleRepository extends Context.Service<
  ArticleRepository,
  ArticleRepositoryService
>()("@typed/realworld/ArticleRepository") {
  static readonly Live = Layer.effect(
    ArticleRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      return {
        create: (authorId, input) => provideRepositorySql(createArticle(authorId, input), sql),
        delete: (authorId, slug) => provideRepositorySql(deleteArticle(authorId, slug), sql),
        favorite: (userId, slug) => provideRepositorySql(favoriteArticle(userId, slug), sql),
        feed: (userId, filter) => provideRepositorySql(feedArticles(userId, filter), sql),
        findBySlug: (slug, viewerId) => provideRepositorySql(findBySlug(slug, viewerId), sql),
        findOwnerIdBySlug: (slug) => provideRepositorySql(findOwnerIdBySlug(slug), sql),
        list: (filter, viewerId) => provideRepositorySql(listArticles(filter, viewerId), sql),
        unfavorite: (userId, slug) => provideRepositorySql(unfavoriteArticle(userId, slug), sql),
        update: (authorId, slug, input) =>
          provideRepositorySql(updateArticle(authorId, slug, input), sql),
      };
    }),
  );
}

interface ArticleRow {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tag_list: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly favorited: number;
  readonly favorites_count: number;
  readonly author_username: string;
  readonly author_bio: string | null;
  readonly author_image: string | null;
  readonly author_following: number;
}

interface ArticleIdentityRow {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
}

const CreateArticleInputSchema = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  body: Schema.String,
  tagList: Schema.optionalKey(Schema.Array(Schema.String)),
});

const UpdateArticleInputSchema = Schema.Struct({
  title: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  body: Schema.optionalKey(Schema.String),
  tagList: Schema.optionalKey(Schema.Array(Schema.String)),
});

const ListFilterSchema = Schema.Struct({
  tag: Schema.optionalKey(TagName),
  author: Schema.optionalKey(Username),
  favorited: Schema.optionalKey(Username),
  limit: Schema.optionalKey(NonNegativeInt),
  offset: Schema.optionalKey(NonNegativeInt),
});

type DecodedCreateArticleInput = Schema.Schema.Type<typeof CreateArticleInputSchema>;
type DecodedUpdateArticleInput = Schema.Schema.Type<typeof UpdateArticleInputSchema>;
type DecodedListFilter = Schema.Schema.Type<typeof ListFilterSchema>;

const listArticles = (
  rawFilter: ArticleListFilter,
  viewerId: Option.Option<UserId>,
): Effect.Effect<ArticleListResult, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const filter = yield* decodeListFilter(rawFilter);
    const rows = yield* selectArticleRows(filter, Option.getOrUndefined(viewerId) ?? 0);
    const articlesCount = yield* countArticleRows(filter);
    const articles = yield* Effect.forEach(rows, toArticlePreview);

    return {
      articles,
      articlesCount,
    };
  });

const feedArticles = (
  userId: UserId,
  rawFilter: ArticleListFilter,
): Effect.Effect<ArticleListResult, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const filter = yield* decodeListFilter(rawFilter);
    const rows = yield* selectFeedRows(userId, filter);
    const articlesCount = yield* countFeedRows(userId);
    const articles = yield* Effect.forEach(rows, toArticlePreview);

    return {
      articles,
      articlesCount,
    };
  });

const createArticle = (
  authorId: UserId,
  rawInput: CreateArticleInput,
): Effect.Effect<Article, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const input = yield* decodeCreateInput(rawInput);
    const sql = yield* SqlClient.SqlClient;

    return yield* sql.withTransaction(Effect.gen(function* () {
      const slug = yield* makeUniqueSlug(input.title);
      const articleId = yield* insertArticle(authorId, slug, input);
      yield* replaceArticleTags(articleId, input.tagList ?? []);
      return yield* requireArticle(slug, Option.some(authorId));
    }));
  });

const updateArticle = (
  authorId: UserId,
  rawSlug: string,
  rawInput: UpdateArticleInput,
): Effect.Effect<Option.Option<Article>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const input = yield* decodeUpdateInput(rawInput);
    const current = yield* selectArticleIdentityBySlug(slug, Option.some(authorId));
    if (Option.isNone(current)) return Option.none();

    const sql = yield* SqlClient.SqlClient;
    return yield* sql.withTransaction(Effect.gen(function* () {
      const articleId = yield* Schema.decodeUnknownEffect(ArticleId)(current.value.id);
      yield* updateArticleRow(current.value, input);
      if (input.tagList !== undefined) yield* replaceArticleTags(articleId, input.tagList);
      return yield* findBySlug(slug, Option.some(authorId));
    }));
  });

const deleteArticle = (
  authorId: UserId,
  rawSlug: string,
): Effect.Effect<boolean, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const current = yield* selectArticleIdentityBySlug(slug, Option.some(authorId));
    if (Option.isNone(current)) return false;

    const sql = yield* SqlClient.SqlClient;
    yield* sql`DELETE FROM articles WHERE id = ${current.value.id}`;
    return true;
  });

const favoriteArticle = (
  userId: UserId,
  rawSlug: string,
): Effect.Effect<Option.Option<Article>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const articleId = yield* selectArticleIdBySlug(slug);
    if (Option.isNone(articleId)) return Option.none();

    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT OR IGNORE INTO favorites (user_id, article_id, created_at)
      VALUES (${userId}, ${articleId.value}, ${currentIsoTimestamp()})
    `;
    return yield* findBySlug(slug, Option.some(userId));
  });

const unfavoriteArticle = (
  userId: UserId,
  rawSlug: string,
): Effect.Effect<Option.Option<Article>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const articleId = yield* selectArticleIdBySlug(slug);
    if (Option.isNone(articleId)) return Option.none();

    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      DELETE FROM favorites
      WHERE user_id = ${userId} AND article_id = ${articleId.value}
    `;
    return yield* findBySlug(slug, Option.some(userId));
  });

const findBySlug = (
  rawSlug: string,
  viewerId: Option.Option<UserId>,
): Effect.Effect<Option.Option<Article>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const row = yield* selectArticleRowBySlug(slug, Option.getOrUndefined(viewerId) ?? 0);
    return yield* decodeArticleOption(row);
  });

const findOwnerIdBySlug = (
  rawSlug: string,
): Effect.Effect<Option.Option<UserId>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const slug = yield* Schema.decodeUnknownEffect(Slug)(rawSlug);
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly author_id: number }>`
      SELECT author_id FROM articles WHERE slug = ${slug} LIMIT 1
    `;

    const row = first(rows);
    if (Option.isNone(row)) return Option.none();

    const authorId = yield* Schema.decodeUnknownEffect(UserId)(row.value.author_id);
    return Option.some(authorId);
  });

const selectArticleRows = (
  filter: DecodedListFilter,
  viewerId: number,
): Effect.Effect<readonly ArticleRow[], ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return yield* sql<ArticleRow>`
      SELECT ${articleColumns(sql, viewerId)}
      FROM articles
      INNER JOIN users ON users.id = articles.author_id
      WHERE ${articleFilters(sql, filter)}
      ORDER BY articles.created_at DESC, articles.id DESC
      LIMIT ${filter.limit ?? defaultLimit}
      OFFSET ${filter.offset ?? 0}
    `;
  });

const countArticleRows = (
  filter: DecodedListFilter,
): Effect.Effect<number, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const [row] = yield* sql<{ readonly count: number }>`
      SELECT COUNT(*) AS count
      FROM articles
      INNER JOIN users ON users.id = articles.author_id
      WHERE ${articleFilters(sql, filter)}
    `;

    return row.count;
  });

const selectFeedRows = (
  userId: UserId,
  filter: DecodedListFilter,
): Effect.Effect<readonly ArticleRow[], ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return yield* sql<ArticleRow>`
      SELECT ${articleColumns(sql, userId)}
      FROM articles
      INNER JOIN users ON users.id = articles.author_id
      INNER JOIN follows ON follows.followed_id = articles.author_id
      WHERE follows.follower_id = ${userId}
      ORDER BY articles.created_at DESC, articles.id DESC
      LIMIT ${filter.limit ?? defaultLimit}
      OFFSET ${filter.offset ?? 0}
    `;
  });

const countFeedRows = (
  userId: UserId,
): Effect.Effect<number, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const [row] = yield* sql<{ readonly count: number }>`
      SELECT COUNT(*) AS count
      FROM articles
      INNER JOIN follows ON follows.followed_id = articles.author_id
      WHERE follows.follower_id = ${userId}
    `;

    return row.count;
  });

const selectArticleRowBySlug = (
  slug: Slug,
  viewerId: number,
): Effect.Effect<Option.Option<ArticleRow>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<ArticleRow>`
      SELECT ${articleColumns(sql, viewerId)}
      FROM articles
      INNER JOIN users ON users.id = articles.author_id
      WHERE articles.slug = ${slug}
      LIMIT 1
    `;

    return first(rows);
  });

const selectArticleIdentityBySlug = (
  slug: Slug,
  authorId: Option.Option<UserId>,
): Effect.Effect<Option.Option<ArticleIdentityRow>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const owner = Option.getOrUndefined(authorId) ?? 0;
    const rows = yield* sql<ArticleIdentityRow>`
      SELECT id, slug, title, description, body
      FROM articles
      WHERE slug = ${slug} AND (${owner} = 0 OR author_id = ${owner})
      LIMIT 1
    `;

    return first(rows);
  });

const selectArticleIdBySlug = (
  slug: Slug,
): Effect.Effect<Option.Option<ArticleId>, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly id: number }>`
      SELECT id FROM articles WHERE slug = ${slug} LIMIT 1
    `;

    const row = first(rows);
    if (Option.isNone(row)) return Option.none();

    const articleId = yield* Schema.decodeUnknownEffect(ArticleId)(row.value.id);
    return Option.some(articleId);
  });

const makeUniqueSlug = (
  title: string,
): Effect.Effect<Slug, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly slug: string }>`SELECT slug FROM articles`;
    return yield* Schema.decodeUnknownEffect(Slug)(
      uniqueSlug(title, rows.map((row) => row.slug)),
    );
  });

const insertArticle = (
  authorId: UserId,
  slug: Slug,
  input: DecodedCreateArticleInput,
): Effect.Effect<ArticleId, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const now = currentIsoTimestamp();
    const [row] = yield* sql<{ readonly id: number }>`
      INSERT INTO articles
        (author_id, slug, title, description, body, created_at, updated_at)
      VALUES
        (${authorId}, ${slug}, ${input.title}, ${input.description}, ${input.body}, ${now}, ${now})
      RETURNING id
    `;

    return yield* Schema.decodeUnknownEffect(ArticleId)(row.id);
  });

const updateArticleRow = (
  current: ArticleIdentityRow,
  input: DecodedUpdateArticleInput,
): Effect.Effect<void, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      UPDATE articles
      SET title = ${input.title ?? current.title},
          description = ${input.description ?? current.description},
          body = ${input.body ?? current.body},
          updated_at = ${currentIsoTimestamp()}
      WHERE id = ${current.id}
    `;
  });

const replaceArticleTags = (
  articleId: ArticleId,
  tags: readonly string[],
): Effect.Effect<void, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`DELETE FROM article_tags WHERE article_id = ${articleId}`;

    const normalized = yield* normalizeTags(tags);
    yield* Effect.forEach(normalized, (tag, position) =>
      upsertTag(tag).pipe(Effect.flatMap((tagId) => insertArticleTag(articleId, tagId, position))),
    );
  });

const upsertTag = (
  tag: TagName,
): Effect.Effect<number, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT INTO tags (name, created_at)
      VALUES (${tag}, ${currentIsoTimestamp()})
      ON CONFLICT(name) DO NOTHING
    `;

    const [row] = yield* sql<{ readonly id: number }>`
      SELECT id FROM tags WHERE name = ${tag} LIMIT 1
    `;
    return row.id;
  });

const insertArticleTag = (
  articleId: ArticleId,
  tagId: number,
  position: number,
): Effect.Effect<void, ArticleRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT INTO article_tags (article_id, tag_id, position)
      VALUES (${articleId}, ${tagId}, ${position})
    `;
  });

const requireArticle = (
  slug: Slug,
  viewerId: Option.Option<UserId>,
): Effect.Effect<Article, ArticleRepositoryError, SqlClient.SqlClient> =>
  findBySlug(slug, viewerId).pipe(
    Effect.flatMap((article) =>
      Option.isSome(article)
        ? Effect.succeed(article.value)
        : Effect.fail(
            new ArticleRepositoryInvariantError({
              message: `Article not found after write: ${slug}`,
            }),
          ),
    ),
  );

const articleColumns = (sql: SqlClient.SqlClient, viewerId: number) => sql`
  articles.id,
  articles.slug,
  articles.title,
  articles.description,
  articles.body,
  articles.created_at,
  articles.updated_at,
  COALESCE((
    SELECT group_concat(tag_name, char(31))
    FROM (
      SELECT tags.name AS tag_name
      FROM article_tags
      INNER JOIN tags ON tags.id = article_tags.tag_id
      WHERE article_tags.article_id = articles.id
      ORDER BY article_tags.position ASC
    )
  ), '') AS tag_list,
  (SELECT COUNT(*) FROM favorites WHERE favorites.article_id = articles.id) AS favorites_count,
  EXISTS(
    SELECT 1 FROM favorites
    WHERE favorites.article_id = articles.id AND favorites.user_id = ${viewerId}
  ) AS favorited,
  users.username AS author_username,
  users.bio AS author_bio,
  users.image AS author_image,
  EXISTS(
    SELECT 1 FROM follows
    WHERE follows.follower_id = ${viewerId} AND follows.followed_id = users.id
  ) AS author_following
`;

const articleFilters = (sql: SqlClient.SqlClient, filter: DecodedListFilter) => {
  const clauses = [
    filter.tag === undefined
      ? undefined
      : sql`
          EXISTS (
            SELECT 1
            FROM article_tags
            INNER JOIN tags ON tags.id = article_tags.tag_id
            WHERE article_tags.article_id = articles.id AND tags.name = ${filter.tag}
          )
        `,
    filter.author === undefined ? undefined : sql`users.username = ${filter.author}`,
    filter.favorited === undefined
      ? undefined
      : sql`
          EXISTS (
            SELECT 1
            FROM favorites
            INNER JOIN users AS favorite_users ON favorite_users.id = favorites.user_id
            WHERE favorites.article_id = articles.id
              AND favorite_users.username = ${filter.favorited}
          )
        `,
  ].filter((clause) => clause !== undefined);

  return clauses.length === 0 ? sql.literal("1 = 1") : sql.and(clauses);
};

const decodeListFilter = (
  filter: ArticleListFilter,
): Effect.Effect<DecodedListFilter, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(ListFilterSchema)(filter);

const decodeCreateInput = (
  input: CreateArticleInput,
): Effect.Effect<DecodedCreateArticleInput, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(CreateArticleInputSchema)(input);

const decodeUpdateInput = (
  input: UpdateArticleInput,
): Effect.Effect<DecodedUpdateArticleInput, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(UpdateArticleInputSchema)(input);

const normalizeTags = (
  tags: readonly string[],
): Effect.Effect<readonly TagName[], Schema.SchemaError> =>
  Effect.forEach(normalizeTagList(tags), (tag) => Schema.decodeUnknownEffect(TagName)(tag));

const parseTagList = (tagList: string | null): readonly string[] =>
  tagList == null || tagList.length === 0 ? [] : tagList.split("\u001f");

const toArticlePreview = (row: ArticleRow): Effect.Effect<ArticlePreview, Schema.SchemaError> =>
  Effect.gen(function* () {
    const author = yield* toAuthorProfile(row);
    return yield* Schema.decodeUnknownEffect(ArticlePreview)(articleShape(row, author));
  });

const toArticle = (row: ArticleRow): Effect.Effect<Article, Schema.SchemaError> =>
  Effect.gen(function* () {
    const author = yield* toAuthorProfile(row);
    return yield* Schema.decodeUnknownEffect(Article)({
      id: row.id,
      ...articleShape(row, author),
      body: row.body,
    });
  });

const articleShape = (row: ArticleRow, author: Profile) => ({
  slug: row.slug,
  title: row.title,
  description: row.description,
  tagList: parseTagList(row.tag_list),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  favorited: Boolean(row.favorited),
  favoritesCount: row.favorites_count,
  author,
});

const toAuthorProfile = (row: ArticleRow): Effect.Effect<Profile, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(Profile)({
    username: row.author_username,
    bio: row.author_bio,
    image: row.author_image,
    following: Boolean(row.author_following),
  });

const decodeArticleOption = (
  row: Option.Option<ArticleRow>,
): Effect.Effect<Option.Option<Article>, Schema.SchemaError> =>
  Option.isSome(row)
    ? Effect.map(toArticle(row.value), Option.some)
    : Effect.succeed(Option.none());
