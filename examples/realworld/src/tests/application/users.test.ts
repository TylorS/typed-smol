import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseAuthorizationHeader } from "../../domain/Auth.js";
import { RealWorldError } from "../../domain/Errors.js";
import { Users } from "../../application/Users.js";
import { resetDatabase } from "../../infrastructure/Reset.js";
import {
  email as emailValue,
  password as passwordValue,
  username as usernameValue,
} from "../helpers/domain.js";
import {
  ApplicationTestLayer,
  defaultDataDirectory,
  makeLayerExitRunner,
  makeLayerRunner,
  type LayerServices,
} from "../helpers/layers.js";

const testDatabasePath = resolve(defaultDataDirectory, "application-users-test.sqlite");
const TestLayer = ApplicationTestLayer({ databasePath: testDatabasePath });
type TestServices = LayerServices<typeof TestLayer>;

const run = makeLayerRunner(TestLayer);
const exit = makeLayerExitRunner(TestLayer);

const expectRealWorldError = async <A, E, R extends TestServices>(
  effect: Effect.Effect<A, E, R>,
): Promise<RealWorldError> => {
  const resultExit = await exit(effect);
  if (Exit.isFailure(resultExit)) {
    const result = Cause.findFail(resultExit.cause);
    if (Result.isSuccess(result)) return result.success.error as RealWorldError;
  }

  throw new Error("Expected RealWorldError failure");
};

const register = (
  username = usernameValue("app_user"),
  email = emailValue("app.user@example.com"),
) =>
  Users.use((users) =>
    users.register({
      user: {
        username,
        email,
        password: passwordValue("password123"),
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
    const loggedIn = await run(
      Users.use((users) =>
        users.login({
          user: {
            email: emailValue("app.user@example.com"),
            password: passwordValue("password123"),
          },
        }),
      ),
    );
    const current = await run(Users.use((users) => users.current(token)));
    const updated = await run(
      Users.use((users) =>
        users.update(token, {
          user: {
            bio: "",
            image: "   ",
          },
        }),
      ),
    );

    expect(loggedIn.user.username).toBe("app_user");
    expect(current.user.email).toBe("app.user@example.com");
    expect(updated.user.bio).toBeNull();
    expect(updated.user.image).toBeNull();
  });

  it("maps validation, duplicate, missing token, and invalid credentials errors", async () => {
    const invalidPassword = await expectRealWorldError(
      Users.use((users) =>
        users.register({
          user: {
            username: usernameValue("blank_user"),
            email: emailValue("blank@example.com"),
            password: passwordValue("short"),
          },
        }),
      ),
    );
    expect(invalidPassword.status).toBe(422);
    expect(invalidPassword.errors.password).toEqual(["can't be blank"]);

    await run(register());
    const duplicate = await expectRealWorldError(
      register(usernameValue("app_user"), emailValue("other@example.com")),
    );
    expect(duplicate.status).toBe(409);
    expect(duplicate.errors.username).toEqual(["has already been taken"]);

    const missingToken = await expectRealWorldError(
      Users.use((users) => users.current(Option.none())),
    );
    expect(missingToken.status).toBe(401);
    expect(missingToken.errors.token).toEqual(["is missing"]);

    const credentials = await expectRealWorldError(
      Users.use((users) =>
        users.login({
          user: {
            email: emailValue("app.user@example.com"),
            password: passwordValue("wrong-password"),
          },
        }),
      ),
    );
    expect(credentials.status).toBe(401);
    expect(credentials.errors.credentials).toEqual(["invalid"]);
  });
});
