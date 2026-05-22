import { SqliteMigrator } from "@effect/sql-sqlite-node";
import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/unstable/sql";

const createInitialSchema = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`PRAGMA foreign_keys = ON`;

  for (const statement of initialSchemaStatements) {
    yield* sql.unsafe(statement);
  }
});

export const runMigrations = SqliteMigrator.run({
  loader: Migrator.fromRecord({
    "0001_initial": createInitialSchema,
  }),
});

const initialSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    bio TEXT NULL,
    image TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (follower_id, followed_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`,
  `CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id)`,
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at)`,
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`,
  `CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    UNIQUE (article_id, position)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id)`,
  `CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id)`,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, article_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_article_id ON favorites(article_id)`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`,
] as const;
