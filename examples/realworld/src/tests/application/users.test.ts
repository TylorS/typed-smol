import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseAuthorizationHeader } from "../../domain/Auth.js";
import { RealWorldError } from "../../domain/Errors.js";
import { Users } from "../../application/Users.js";
import { defaultDataDirectory, RealWorldConfig } from "../../infrastructure/Config.js";
import { PasswordHasher } from "../../infrastructure/PasswordHasher.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { SqliteLive } from "../../infrastructure/Sql.js";
import { SessionTokens } from "../../infrastructure/SessionTokens.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";

const testDatabasePath = resolve(defaultDataDirectory, "application-users-test.sqlite");
const TestConfig = RealWorldConfig.layer({ databasePath: testDatabasePath });

const provideServices = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.provide(Users.Live),
    Effect.provide(UserRepository.Live),
    Effect.provide(SessionTokens.Live),
    Effect.provide(PasswordHasher.Live),
    Effect.provide(SqliteLive),
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

const register = (username = "app_user", email = "app.user@example.com") =>
  Users.use((users) =>
    users.register({
      user: {
        username,
        email,
        password: "password123",
      },
    }),
  );

describe("user application service", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("registers, logs in, reads current user, and updates nullable fields", async () => {
    const registered = await run(register());
    const token = parseAuthorizationHeader(`Token ${registered.user.token}`);
    const loggedIn = await run(Users.use((users) =>
      users.login({
        user: {
          email: "app.user@example.com",
          password: "password123",
        },
      }),
    ));
    const current = await run(Users.use((users) => users.current(token)));
    const updated = await run(Users.use((users) =>
      users.update(token, {
        user: {
          bio: "",
          image: "   ",
        },
      }),
    ));

    expect(loggedIn.user.username).toBe("app_user");
    expect(current.user.email).toBe("app.user@example.com");
    expect(updated.user.bio).toBeNull();
    expect(updated.user.image).toBeNull();
  });

  it("maps validation, duplicate, missing token, and invalid credentials errors", async () => {
    const blank = await expectRealWorldError(Users.use((users) =>
      users.register({
        user: {
          username: "",
          email: "blank@example.com",
          password: "password123",
        },
      }),
    ));
    expect(blank.status).toBe(422);
    expect(blank.errors.username).toEqual(["can't be blank"]);

    await run(register());
    const duplicate = await expectRealWorldError(register("app_user", "other@example.com"));
    expect(duplicate.status).toBe(409);
    expect(duplicate.errors.username).toEqual(["has already been taken"]);

    const missingToken = await expectRealWorldError(Users.use((users) =>
      users.current(Option.none()),
    ));
    expect(missingToken.status).toBe(401);
    expect(missingToken.errors.token).toEqual(["is missing"]);

    const credentials = await expectRealWorldError(Users.use((users) =>
      users.login({
        user: {
          email: "app.user@example.com",
          password: "wrong-password",
        },
      }),
    ));
    expect(credentials.status).toBe(401);
    expect(credentials.errors.credentials).toEqual(["invalid"]);
  });
});
