import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";

const now = "2026-05-16T18:00:00.000Z";

export interface SeedCounts {
  readonly users: number;
  readonly follows: number;
  readonly articles: number;
  readonly tags: number;
  readonly favorites: number;
  readonly comments: number;
}

export const collectSeedCounts = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const [counts] = yield* sql<SeedCounts>`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM follows) AS follows,
      (SELECT COUNT(*) FROM articles) AS articles,
      (SELECT COUNT(*) FROM tags) AS tags,
      (SELECT COUNT(*) FROM favorites) AS favorites,
      (SELECT COUNT(*) FROM comments) AS comments
  `;

  return counts;
});

export const seedDatabase = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql.withTransaction(
    Effect.gen(function* () {
      yield* clearSeedTables;
      yield* insertUsers;
      yield* insertTags;
      yield* insertArticles;
      yield* insertArticleTags;
      yield* insertRelationships;
    }),
  );

  return yield* collectSeedCounts;
});

const clearSeedTables = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  for (const table of clearOrder) {
    yield* sql.unsafe(`DELETE FROM ${table}`);
  }
});

const insertUsers = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* Effect.forEach(
    seedUsers,
    (user) => sql`
    INSERT INTO users
      (id, username, email, password_hash, password_salt, bio, image, created_at, updated_at)
    VALUES
      (${user.id}, ${user.username}, ${user.email}, ${user.passwordHash},
       ${user.passwordSalt}, ${user.bio}, ${user.image}, ${now}, ${now})
  `,
  );
});

const insertTags = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* Effect.forEach(
    seedTags,
    (name, index) => sql`
    INSERT INTO tags (id, name, created_at)
    VALUES (${index + 1}, ${name}, ${now})
  `,
  );
});

const insertArticles = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* Effect.forEach(
    seedArticles,
    (article) => sql`
    INSERT INTO articles
      (id, author_id, slug, title, description, body, created_at, updated_at)
    VALUES
      (${article.id}, ${article.authorId}, ${article.slug}, ${article.title},
       ${article.description}, ${article.body}, ${article.createdAt}, ${article.createdAt})
  `,
  );
});

const insertArticleTags = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* Effect.forEach(seedArticles, (article) =>
    Effect.forEach(
      article.tagIds,
      (tagId, position) => sql`
      INSERT INTO article_tags (article_id, tag_id, position)
      VALUES (${article.id}, ${tagId}, ${position})
    `,
    ),
  );
});

const insertRelationships = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`INSERT INTO follows (follower_id, followed_id, created_at) VALUES (1, 2, ${now})`;
  yield* sql`INSERT INTO favorites (user_id, article_id, created_at) VALUES (1, 1, ${now})`;
  yield* sql`
    INSERT INTO comments (id, article_id, author_id, body, created_at, updated_at)
    VALUES (1, 1, 1, ${"This seed article proves comments are real."}, ${now}, ${now})
  `;
});

const clearOrder = [
  "comments",
  "favorites",
  "article_tags",
  "articles",
  "follows",
  "sessions",
  "tags",
  "users",
] as const;

const seedTags = ["typed", "effect", "realworld", "sqlite", "ssr"] as const;

const seedUsers = [
  {
    id: 1,
    username: "seed_reader",
    email: "seed.reader@example.com",
    passwordHash: "seed-reader-hash",
    passwordSalt: "seed-reader-salt",
    bio: "Reads every RealWorld implementation.",
    image: null,
  },
  {
    id: 2,
    username: "seed_author",
    email: "seed.author@example.com",
    passwordHash: "seed-author-hash",
    passwordSalt: "seed-author-salt",
    bio: "Writes about Typed and Effect.",
    image: "/default-avatar.svg",
  },
  {
    id: 3,
    username: "seed_secondary",
    email: "seed.secondary@example.com",
    passwordHash: "seed-secondary-hash",
    passwordSalt: "seed-secondary-salt",
    bio: null,
    image: "/default-avatar.svg",
  },
] as const;

const seedArticles = Array.from({ length: 15 }, (_, index) => {
  const id = index + 1;
  const authorId = id % 3 === 0 ? 3 : 2;
  const primaryTag = (index % seedTags.length) + 1;
  const tagIds = primaryTag === 2 ? [2, 1] : [primaryTag, 2];

  return {
    id,
    authorId,
    slug: `seeded-typed-realworld-${id}`,
    title: `Seeded Typed RealWorld ${id}`,
    description: `Seeded article ${id} for local RealWorld pagination.`,
    body: `This is deterministic seed article ${id}.`,
    createdAt: `2026-05-${String(16 - index).padStart(2, "0")}T18:00:00.000Z`,
    tagIds,
  };
});
