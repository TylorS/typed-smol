import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseAuthorizationHeader } from "../../domain/Auth.js";
import { RealWorldError } from "../../domain/Errors.js";
import { Articles } from "../../application/Articles.js";
import { Comments } from "../../application/Comments.js";
import { Profiles } from "../../application/Profiles.js";
import { Tags } from "../../application/Tags.js";
import { Users } from "../../application/Users.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import {
  ApplicationTestLayer,
  defaultDataDirectory,
  exitWithLayer,
  runWithLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "application-social-test.sqlite");
const TestLayer = ApplicationTestLayer({ databasePath: testDatabasePath });

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  runWithLayer(effect, TestLayer);

const expectRealWorldError = async <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Promise<RealWorldError> => {
  const exit = await exitWithLayer(effect, TestLayer);
  if (Exit.isFailure(exit)) {
    const result = Cause.findFail(exit.cause);
    if (Result.isSuccess(result)) return result.success.error as RealWorldError;
  }

  throw new Error("Expected RealWorldError failure");
};

const registerToken = (username: string, email: string) =>
  Users.use((users) =>
    users.register({
      user: {
        username,
        email,
        password: "password123",
      },
    }),
  ).pipe(Effect.map((response) => parseAuthorizationHeader(`Token ${response.user.token}`)));

describe("profile, comment, and tag application services", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("follows profiles, creates comments, deletes owned comments, and lists tags", async () => {
    const token = await run(registerToken("social_user", "social.user@example.com"));
    const followed = await run(Profiles.use((profiles) =>
      profiles.follow(token, "seed_author"),
    ));
    const profile = await run(Profiles.use((profiles) =>
      profiles.get("seed_author", token),
    ));
    const comment = await run(Comments.use((comments) =>
      comments.create(token, "seeded-typed-realworld-1", {
        comment: { body: "Application comment" },
      }),
    ));
    const comments = await run(Comments.use((service) =>
      service.list("seeded-typed-realworld-1", token),
    ));
    const tags = await run(Tags.use((service) => service.list()));

    expect(followed.profile.following).toBe(true);
    expect(profile.profile.following).toBe(true);
    expect(comment.comment.body).toBe("Application comment");
    expect(comments.comments.map((item) => item.body)).toContain("Application comment");
    expect(tags.tags).toEqual(expect.arrayContaining(["typed", "effect"]));

    await expect(run(Comments.use((service) =>
      service.delete(token, "seeded-typed-realworld-1", comment.comment.id),
    ))).resolves.toBeUndefined();
  });

  it("maps profile, comment, and authorization errors", async () => {
    const owner = await run(registerToken("comment_owner", "comment.owner@example.com"));
    const other = await run(registerToken("comment_other", "comment.other@example.com"));
    const missingProfile = await expectRealWorldError(Profiles.use((profiles) =>
      profiles.get("missing_user", Option.none()),
    ));
    expect(missingProfile.status).toBe(404);
    expect(missingProfile.errors.profile).toEqual(["not found"]);

    const missingToken = await expectRealWorldError(Profiles.use((profiles) =>
      profiles.follow(Option.none(), "seed_author"),
    ));
    expect(missingToken.status).toBe(401);
    expect(missingToken.errors.token).toEqual(["is missing"]);

    const blankComment = await expectRealWorldError(Comments.use((comments) =>
      comments.create(owner, "seeded-typed-realworld-1", { comment: { body: "" } }),
    ));
    expect(blankComment.status).toBe(422);
    expect(blankComment.errors.body).toEqual(["can't be blank"]);

    const created = await run(Comments.use((comments) =>
      comments.create(owner, "seeded-typed-realworld-1", {
        comment: { body: "Owned comment" },
      }),
    ));
    const forbidden = await expectRealWorldError(Comments.use((comments) =>
      comments.delete(other, "seeded-typed-realworld-1", created.comment.id),
    ));
    expect(forbidden.status).toBe(403);
    expect(forbidden.errors.comment).toEqual(["forbidden"]);
  });
});
