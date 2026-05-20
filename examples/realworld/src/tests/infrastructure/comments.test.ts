import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Effect, Option } from "effect";
import * as Schema from "effect/Schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommentId, UserId } from "../../domain/Ids.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { CommentRepository } from "../../infrastructure/repositories/CommentRepository.js";
import {
  CommentRepositoryTestLayer,
  defaultDataDirectory,
  runWithLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "comments-test.sqlite");
const TestLayer = CommentRepositoryTestLayer({ databasePath: testDatabasePath });
const seedSlug = "seeded-typed-realworld-1";

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  runWithLayer(effect, TestLayer);

const userId = (id: number) => Schema.decodeUnknownSync(UserId)(id);
const commentId = (id: number) => Schema.decodeUnknownSync(CommentId)(id);

describe("comment repository", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("lists seeded comments with author profile data", async () => {
    const comments = await run(CommentRepository.use((repository) =>
      repository.listByArticle(seedSlug, Option.some(userId(1))),
    ));

    expect(Option.isSome(comments)).toBe(true);
    if (Option.isSome(comments)) {
      expect(comments.value).toHaveLength(1);
      expect(comments.value[0].body).toBe("This seed article proves comments are real.");
      expect(comments.value[0].author.username).toBe("seed_reader");
    }
  });

  it("creates comments and exposes owner lookup", async () => {
    const created = await run(CommentRepository.use((repository) =>
      repository.create(userId(2), seedSlug, "A new comment"),
    ));

    expect(Option.isSome(created)).toBe(true);
    if (Option.isSome(created)) {
      const owner = await run(CommentRepository.use((repository) =>
        repository.findOwnerId(created.value.id),
      ));

      expect(created.value.body).toBe("A new comment");
      expect(created.value.author.username).toBe("seed_author");
      expect(owner).toEqual(Option.some(userId(2)));
    }
  });

  it("deletes one comment without deleting the rest", async () => {
    const first = await run(CommentRepository.use((repository) =>
      repository.create(userId(1), seedSlug, "First comment"),
    ));
    const second = await run(CommentRepository.use((repository) =>
      repository.create(userId(1), seedSlug, "Second comment"),
    ));

    expect(Option.isSome(first)).toBe(true);
    expect(Option.isSome(second)).toBe(true);
    if (Option.isNone(first) || Option.isNone(second)) return;

    await expect(run(CommentRepository.use((repository) =>
      repository.delete(userId(1), first.value.id),
    ))).resolves.toBe(true);

    const comments = await run(CommentRepository.use((repository) =>
      repository.listByArticle(seedSlug, Option.none()),
    ));
    expect(Option.isSome(comments)).toBe(true);
    if (Option.isNone(comments)) return;

    const bodies = comments.value.map((comment) => comment.body);

    expect(bodies).toContain("Second comment");
    expect(bodies).not.toContain("First comment");
    expect(await run(CommentRepository.use((repository) =>
      repository.delete(userId(2), second.value.id),
    ))).toBe(false);
    expect(await run(CommentRepository.use((repository) =>
      repository.findOwnerId(commentId(9999)),
    ))).toEqual(Option.none());
  });
});
