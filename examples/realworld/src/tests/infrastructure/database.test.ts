import { existsSync, rmSync } from "node:fs";
import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  RealWorldConfig,
  defaultDatabasePath,
} from "../../infrastructure/Config.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { withSqlite } from "../../infrastructure/Sql.js";

const run = <A, E>(effect: Effect.Effect<A, E, RealWorldConfig>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, RealWorldConfig.Live));

const removeDatabase = (): void => rmSync(defaultDatabasePath, { force: true });

const listSqliteObjects = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const rows = yield* sql<{ readonly name: string; readonly type: string }>`
    SELECT name, type
    FROM sqlite_master
    WHERE type IN ('table', 'index')
    ORDER BY type, name
  `;

  return rows.map((row) => row.name);
});

describe("SQLite migration, reset, and seed", () => {
  beforeEach(removeDatabase);
  afterEach(removeDatabase);

  it("reset creates the default SQLite database file", async () => {
    const counts = await run(resetDatabase);

    expect(existsSync(defaultDatabasePath)).toBe(true);
    expect(counts).toMatchObject({
      users: 3,
      follows: 1,
      articles: 15,
      tags: 5,
      favorites: 1,
      comments: 1,
    });
  });

  it("migrations create every required table and index", async () => {
    await run(resetDatabase);

    const objects = await run(withSqlite(listSqliteObjects));

    expect(objects).toEqual(expect.arrayContaining([
      "users",
      "sessions",
      "follows",
      "articles",
      "tags",
      "article_tags",
      "favorites",
      "comments",
      "idx_users_username",
      "idx_users_email",
      "idx_sessions_token",
      "idx_follows_follower_id",
      "idx_follows_followed_id",
      "idx_articles_author_id",
      "idx_articles_created_at",
      "idx_tags_name",
      "idx_article_tags_article_id",
      "idx_article_tags_tag_id",
      "idx_favorites_user_id",
      "idx_favorites_article_id",
      "idx_comments_article_id",
      "idx_comments_author_id",
      "idx_comments_created_at",
    ]));
  });

  it("second reset returns identical deterministic seed counts", async () => {
    const first = await run(resetDatabase);
    const second = await run(resetDatabase);

    expect(second).toEqual(first);
  });
});
