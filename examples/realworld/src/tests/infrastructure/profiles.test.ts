import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Option } from "effect";
import * as Schema from "effect/Schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserId } from "../../domain/Ids.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { ProfileRepository } from "../../infrastructure/repositories/ProfileRepository.js";
import {
  defaultDataDirectory,
  makeLayerRunner,
  ProfileRepositoryTestLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "profiles-test.sqlite");
const TestLayer = ProfileRepositoryTestLayer({ databasePath: testDatabasePath });

const run = makeLayerRunner(TestLayer);

const userId = (id: number) => Schema.decodeUnknownSync(UserId)(id);

describe("profile repository", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("loads public profiles and viewer-specific following state", async () => {
    const anonymous = await run(
      ProfileRepository.use((profiles) => profiles.findByUsername("seed_author", Option.none())),
    );
    const readerView = await run(
      ProfileRepository.use((profiles) =>
        profiles.findByUsername("seed_author", Option.some(userId(1))),
      ),
    );

    expect(Option.isSome(anonymous)).toBe(true);
    expect(Option.isSome(readerView)).toBe(true);
    if (Option.isSome(anonymous)) {
      expect(anonymous.value.following).toBe(false);
      expect(anonymous.value.bio).toBe("Writes about Typed and Effect.");
    }
    if (Option.isSome(readerView)) expect(readerView.value.following).toBe(true);
  });

  it("follows and unfollows profiles idempotently", async () => {
    const unfollowed = await run(
      ProfileRepository.use((profiles) => profiles.unfollow(userId(1), "seed_author")),
    );
    const followed = await run(
      ProfileRepository.use((profiles) => profiles.follow(userId(1), "seed_author")),
    );

    expect(Option.isSome(unfollowed)).toBe(true);
    expect(Option.isSome(followed)).toBe(true);
    if (Option.isSome(unfollowed)) expect(unfollowed.value.following).toBe(false);
    if (Option.isSome(followed)) expect(followed.value.following).toBe(true);
  });

  it("returns none for unknown profiles and follow targets", async () => {
    const profile = await run(
      ProfileRepository.use((profiles) =>
        profiles.findByUsername("missing_user", Option.some(userId(1))),
      ),
    );
    const followed = await run(
      ProfileRepository.use((profiles) => profiles.follow(userId(1), "missing_user")),
    );

    expect(Option.isNone(profile)).toBe(true);
    expect(Option.isNone(followed)).toBe(true);
  });
});
