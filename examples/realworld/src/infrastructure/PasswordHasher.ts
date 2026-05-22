import { Buffer } from "node:buffer";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { Context, Effect, Layer } from "effect";
import * as Schema from "effect/Schema";
import { NonEmptyString } from "../domain/Ids.js";
import { PasswordHashError } from "../domain/RepositoryErrors.js";

export const StoredPassword = Schema.Struct({
  passwordHash: NonEmptyString,
  passwordSalt: NonEmptyString,
});
export type StoredPassword = Schema.Schema.Type<typeof StoredPassword>;

export interface PasswordHasherService {
  readonly hash: (password: string) => Effect.Effect<StoredPassword, PasswordHashError>;
  readonly verify: (
    password: string,
    stored: StoredPassword,
  ) => Effect.Effect<boolean, PasswordHashError>;
}

export class PasswordHasher extends Context.Service<PasswordHasher, PasswordHasherService>()(
  "@typed/realworld/PasswordHasher",
) {
  static readonly Live = Layer.succeed(PasswordHasher, {
    hash: (password) =>
      Effect.gen(function* () {
        const passwordSalt = randomBytes(16).toString("hex");
        const passwordHash = yield* derivePasswordHash(password, passwordSalt);
        return Schema.decodeUnknownSync(StoredPassword)({ passwordHash, passwordSalt });
      }),
    verify: (password, stored) =>
      Effect.gen(function* () {
        const passwordHash = yield* derivePasswordHash(password, stored.passwordSalt);
        return timingSafeEqualHex(passwordHash, stored.passwordHash);
      }),
  });
}

const derivePasswordHash = (
  password: string,
  salt: string,
): Effect.Effect<string, PasswordHashError> =>
  Effect.tryPromise({
    try: () =>
      new Promise<string>((resolve, reject) => {
        scrypt(password, salt, 64, (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(derivedKey.toString("hex"));
        });
      }),
    catch: (error) =>
      new PasswordHashError({
        reason: error instanceof Error ? error.message : String(error),
      }),
  });

const timingSafeEqualHex = (leftHex: string, rightHex: string): boolean => {
  const left = Uint8Array.from(Buffer.from(leftHex, "hex"));
  const right = Uint8Array.from(Buffer.from(rightHex, "hex"));

  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
};
