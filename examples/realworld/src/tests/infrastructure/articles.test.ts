import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Effect, Option } from "effect";
import * as Schema from "effect/Schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserId } from "../../domain/Ids.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { ArticleRepository } from "../../infrastructure/repositories/ArticleRepository.js";
import { TagRepository } from "../../infrastructure/repositories/TagRepository.js";
import {
  ArticleRepositoryTestLayer,
  defaultDataDirectory,
  runWithLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "articles-test.sqlite");
const TestLayer = ArticleRepositoryTestLayer({ databasePath: testDatabasePath });

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  runWithLayer(effect, TestLayer);

const userId = (id: number) => Schema.decodeUnknownSync(UserId)(id);

describe("article and tag repositories", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("lists global articles with pagination, viewer favorite state, and no body", async () => {
    const anonymous = await run(ArticleRepository.use((articles) =>
      articles.list({}, Option.none()),
    ));
    const reader = await run(ArticleRepository.use((articles) =>
      articles.list({ limit: 1, offset: 0 }, Option.some(userId(1))),
    ));

    expect(anonymous.articlesCount).toBe(15);
    expect(anonymous.articles).toHaveLength(10);
    expect(anonymous.articles[0].slug).toBe("seeded-typed-realworld-1");
    expect("body" in anonymous.articles[0]).toBe(false);
    expect(reader.articles[0].favorited).toBe(true);
    expect(reader.articles[0].favoritesCount).toBe(1);
  });

  it("filters articles by tag, author, favorited username, and offset", async () => {
    const byTag = await run(ArticleRepository.use((articles) =>
      articles.list({ tag: "typed" }, Option.none()),
    ));
    const byAuthor = await run(ArticleRepository.use((articles) =>
      articles.list({ author: "seed_secondary" }, Option.none()),
    ));
    const byFavorited = await run(ArticleRepository.use((articles) =>
      articles.list({ favorited: "seed_reader" }, Option.some(userId(1))),
    ));
    const secondPage = await run(ArticleRepository.use((articles) =>
      articles.list({ limit: 1, offset: 1 }, Option.none()),
    ));

    expect(byTag.articles.every((article) => article.tagList.includes("typed"))).toBe(true);
    expect(byAuthor.articles.every((article) => article.author.username === "seed_secondary"))
      .toBe(true);
    expect(byFavorited.articles.map((article) => article.slug)).toEqual([
      "seeded-typed-realworld-1",
    ]);
    expect(secondPage.articles.map((article) => article.slug)).toEqual([
      "seeded-typed-realworld-2",
    ]);
  });

  it("returns feed articles from followed authors only", async () => {
    const feed = await run(ArticleRepository.use((articles) =>
      articles.feed(userId(1), { limit: 20, offset: 0 }),
    ));

    expect(feed.articlesCount).toBe(10);
    expect(feed.articles.every((article) => article.author.username === "seed_author"))
      .toBe(true);
  });

  it("creates unique slugs, updates tag semantics, favorites, and deletes articles", async () => {
    const created = await run(ArticleRepository.use((articles) =>
      articles.create(userId(1), {
        title: "Hello Typed",
        description: "A created article",
        body: "Real repository data.",
        tagList: [" typed ", "effect", "typed", ""],
      }),
    ));
    const duplicate = await run(ArticleRepository.use((articles) =>
      articles.create(userId(1), {
        title: "Hello Typed",
        description: "Another article",
        body: "Unique slugs are required.",
        tagList: [],
      }),
    ));

    expect(created.slug).toBe("hello-typed");
    expect(created.tagList).toEqual(["typed", "effect"]);
    expect(duplicate.slug).toBe("hello-typed-2");

    const preserved = await run(ArticleRepository.use((articles) =>
      articles.update(userId(1), created.slug, { body: "Updated body" }),
    ));
    expect(Option.isSome(preserved)).toBe(true);
    if (Option.isSome(preserved)) expect(preserved.value.tagList).toEqual(["typed", "effect"]);

    const removed = await run(ArticleRepository.use((articles) =>
      articles.update(userId(1), created.slug, { tagList: [] }),
    ));
    expect(Option.isSome(removed)).toBe(true);
    if (Option.isSome(removed)) expect(removed.value.tagList).toEqual([]);

    const favorited = await run(ArticleRepository.use((articles) =>
      articles.favorite(userId(2), created.slug),
    ));
    expect(Option.isSome(favorited)).toBe(true);
    if (Option.isSome(favorited)) {
      expect(favorited.value.favorited).toBe(true);
      expect(favorited.value.favoritesCount).toBe(1);
    }

    const unfavorited = await run(ArticleRepository.use((articles) =>
      articles.unfavorite(userId(2), created.slug),
    ));
    expect(Option.isSome(unfavorited)).toBe(true);
    if (Option.isSome(unfavorited)) expect(unfavorited.value.favorited).toBe(false);

    await expect(run(ArticleRepository.use((articles) =>
      articles.delete(userId(1), created.slug),
    ))).resolves.toBe(true);
    const deleted = await run(ArticleRepository.use((articles) =>
      articles.findBySlug(created.slug, Option.none()),
    ));
    expect(Option.isNone(deleted)).toBe(true);
  });

  it("lists tags from seed data and created articles", async () => {
    await run(ArticleRepository.use((articles) =>
      articles.create(userId(1), {
        title: "Tag Repository",
        description: "Adds a new tag",
        body: "Tag data should be real.",
        tagList: ["newtag"],
      }),
    ));
    const tags = await run(TagRepository.use((tagRepository) => tagRepository.list()));

    expect(tags).toEqual(expect.arrayContaining(["typed", "effect", "newtag"]));
  });
});
