import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PasswordHasher } from "../../infrastructure/PasswordHasher.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import { SessionTokens } from "../../infrastructure/SessionTokens.js";
import { withSqlite } from "../../infrastructure/Sql.js";
import { DuplicateUserField, PasswordPolicyError } from "../../domain/RepositoryErrors.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import {
  defaultDataDirectory,
  makeLayerExitRunner,
  makeLayerRunner,
  type LayerServices,
  UserRepositoryTestLayer,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "users-test.sqlite");
const TestLayer = UserRepositoryTestLayer({ databasePath: testDatabasePath });
type TestServices = LayerServices<typeof TestLayer>;

const run = makeLayerRunner(TestLayer);
const exit = makeLayerExitRunner(TestLayer);

const createUser = UserRepository.use((repo) =>
  repo.create({
    username: "new_user",
    email: "new.user@example.com",
    password: "correct-password",
  }),
);

const readPasswordRow = (email: string) =>
  withSqlite(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const [row] = yield* sql<{
        readonly password_hash: string;
        readonly password_salt: string;
      }>`SELECT password_hash, password_salt FROM users WHERE email = ${email}`;

      return row;
    }),
  );

const expectFailure = async <A, E, R extends TestServices>(
  effect: Effect.Effect<A, E, R>,
): Promise<E> => {
  const resultExit = await exit(effect);

  if (Exit.isFailure(resultExit)) {
    const result = Cause.findFail(resultExit.cause);
    if (Result.isSuccess(result)) return result.success.error as E;
  }

  throw new Error("Expected effect to fail");
};

describe("user persistence services", () => {
  beforeEach(async () => {
    await run(resetDatabase);
  });

  afterEach(() => {
    rmSync(testDatabasePath, { force: true });
  });

  it("hashes and verifies passwords without plaintext persistence", async () => {
    const hasher = await run(PasswordHasher);
    const hashed = await run(hasher.hash("correct-password"));

    expect(hashed.passwordHash).not.toBe("correct-password");
    expect(hashed.passwordSalt.length).toBeGreaterThan(16);
    await expect(run(hasher.verify("correct-password", hashed))).resolves.toBe(true);
    await expect(run(hasher.verify("wrong-password", hashed))).resolves.toBe(false);

    await run(createUser);
    const row = await run(readPasswordRow("new.user@example.com"));

    expect(row.password_hash).not.toContain("correct-password");
    expect(row.password_salt).not.toContain("correct-password");
  });

  it("rejects duplicate usernames and emails", async () => {
    await run(createUser);

    const usernameError = await expectFailure(createUser);
    const emailError = await expectFailure(
      UserRepository.use((repo) =>
        repo.create({
          username: "other_user",
          email: "new.user@example.com",
          password: "correct-password",
        }),
      ),
    );

    expect(usernameError).toBeInstanceOf(DuplicateUserField);
    expect(emailError).toBeInstanceOf(DuplicateUserField);
    expect((usernameError as DuplicateUserField).field).toBe("username");
    expect((emailError as DuplicateUserField).field).toBe("email");
  });

  it("creates opaque sessions and finds users by token", async () => {
    const user = await run(createUser);
    const token = await run(SessionTokens.use((sessions) => sessions.create(user.id)));
    const found = await run(UserRepository.use((repo) => repo.findByToken(token)));

    expect(token).not.toContain(".");
    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.email).toBe("new.user@example.com");
    }
  });

  it("normalizes user updates and enforces password policy", async () => {
    const user = await run(createUser);

    const shortPassword = await expectFailure(
      UserRepository.use((repo) => repo.update(user.id, { password: "short" })),
    );
    expect(shortPassword).toBeInstanceOf(PasswordPolicyError);

    const updated = await run(
      UserRepository.use((repo) =>
        repo.update(user.id, {
          bio: "",
          image: "   ",
          password: "updated-password",
        }),
      ),
    );

    expect(updated.bio).toBeNull();
    expect(updated.image).toBeNull();
    await expect(
      run(
        UserRepository.use((repo) =>
          repo.verifyCredentials("new.user@example.com", "updated-password"),
        ),
      ),
    ).resolves.toEqual(expect.objectContaining({ _tag: "Some" }));
  });
});
