import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseAuthorizationHeader } from "../../domain/Auth.js";
import { RealWorldError } from "../../domain/Errors.js";
import { Articles } from "../../application/Articles.js";
import { Users } from "../../application/Users.js";
import { defaultDataDirectory, RealWorldConfig } from "../../infrastructure/Config.js";
import { PasswordHasher } from "../../infrastructure/PasswordHasher.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { SessionTokens } from "../../infrastructure/SessionTokens.js";
import { ArticleRepository } from "../../infrastructure/repositories/ArticleRepository.js";
import { ProfileRepository } from "../../infrastructure/repositories/ProfileRepository.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";

const testDatabasePath = resolve(defaultDataDirectory, "application-articles-test.sqlite");
const TestConfig = RealWorldConfig.layer({ databasePath: testDatabasePath });

const provideServices = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.provide(Articles.Live),
    Effect.provide(Users.Live),
    Effect.provide(ArticleRepository.Live),
    Effect.provide(ProfileRepository.Live),
    Effect.provide(UserRepository.Live),
    Effect.provide(SessionTokens.Live),
    Effect.provide(PasswordHasher.Live),
    Effect.provide(TestConfig),
  );

const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
  Effect.runPromise(provideServices(effect));

const expectRealWorldError = async <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Promise<RealWorldError> => {
  const exit = await Effect.runPromiseExit(provideServices(effect));
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

describe("article application service", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("lists, creates, gets, feeds, favorites, updates, and deletes articles", async () => {
    const token = await run(registerToken("article_user", "article.user@example.com"));
    const created = await run(Articles.use((articles) =>
      articles.create(token, {
        article: {
          title: "Application Article",
          description: "Created through the application layer",
          body: "Article body",
          tagList: ["typed", "app"],
        },
      }),
    ));
    const fetched = await run(Articles.use((articles) =>
      articles.get(token, created.article.slug),
    ));
    const global = await run(Articles.use((articles) =>
      articles.list({ tag: "typed", limit: 5, offset: 0 }, Option.none()),
    ));
    const favorited = await run(Articles.use((articles) =>
      articles.favorite(token, created.article.slug),
    ));
    const updated = await run(Articles.use((articles) =>
      articles.update(token, created.article.slug, { article: { body: "Updated" } }),
    ));

    expect(created.article.slug).toBe("application-article");
    expect(fetched.article.body).toBe("Article body");
    expect(global.articles.length).toBeGreaterThan(0);
    expect(favorited.article.favorited).toBe(true);
    expect(updated.article.body).toBe("Updated");
    await expect(run(Articles.use((articles) =>
      articles.delete(token, created.article.slug),
    ))).resolves.toBeUndefined();
  });

  it("maps missing token, validation, not found, and forbidden article errors", async () => {
    const owner = await run(registerToken("owner_user", "owner.user@example.com"));
    const other = await run(registerToken("other_user", "other.user@example.com"));
    const missingToken = await expectRealWorldError(Articles.use((articles) =>
      articles.create(Option.none(), {
        article: { title: "No Auth", description: "test", body: "test" },
      }),
    ));
    expect(missingToken.status).toBe(401);
    expect(missingToken.errors.token).toEqual(["is missing"]);

    const blankTitle = await expectRealWorldError(Articles.use((articles) =>
      articles.create(owner, {
        article: { title: "", description: "test", body: "test" },
      }),
    ));
    expect(blankTitle.status).toBe(422);
    expect(blankTitle.errors.title).toEqual(["can't be blank"]);

    const missing = await expectRealWorldError(Articles.use((articles) =>
      articles.get(Option.none(), "missing-article"),
    ));
    expect(missing.status).toBe(404);
    expect(missing.errors.article).toEqual(["not found"]);

    const created = await run(Articles.use((articles) =>
      articles.create(owner, {
        article: {
          title: "Owned Article",
          description: "test",
          body: "test",
        },
      }),
    ));
    const forbidden = await expectRealWorldError(Articles.use((articles) =>
      articles.delete(other, created.article.slug),
    ));
    expect(forbidden.status).toBe(403);
    expect(forbidden.errors.article).toEqual(["forbidden"]);
  });
});
