import { Effect, Option } from "effect";
import { RealWorldError, makeRealWorldError } from "../domain/Errors.js";
import type { OpaqueToken, UserId } from "../domain/Ids.js";
import type { UserResponse } from "../domain/RealWorldApi.js";
import type { User } from "../domain/User.js";
import type { UserRepositoryService } from "../infrastructure/repositories/UserRepository.js";

export const tokenMissing = (): RealWorldError => makeRealWorldError(401, "token", "is missing");

export const tokenInvalid = (): RealWorldError => makeRealWorldError(401, "token", "is invalid");

export const validationError = (field: string): RealWorldError =>
  makeRealWorldError(422, field, "can't be blank");

export const notFound = (field: string): RealWorldError =>
  makeRealWorldError(404, field, "not found");

export const forbidden = (field: string): RealWorldError =>
  makeRealWorldError(403, field, "forbidden");

export const invalidCredentials = (): RealWorldError =>
  makeRealWorldError(401, "credentials", "invalid");

export const duplicate = (field: string): RealWorldError =>
  makeRealWorldError(409, field, "has already been taken");

export const requireNonBlank = (
  field: string,
  value: string | null | undefined,
): Effect.Effect<string, RealWorldError> =>
  value == null || value.trim().length === 0
    ? Effect.fail(validationError(field))
    : Effect.succeed(value);

export const requireUser = (
  token: Option.Option<OpaqueToken>,
  users: UserRepositoryService,
): Effect.Effect<User, RealWorldError> =>
  Option.match(token, {
    onNone: () => Effect.fail(tokenMissing()),
    onSome: (value) =>
      users.findByToken(value).pipe(Effect.flatMap(Effect.fromOption), Effect.catch(tokenInvalid)),
  });

export const optionalUserId = (
  token: Option.Option<OpaqueToken>,
  users: UserRepositoryService,
): Effect.Effect<Option.Option<UserId>> =>
  requireUser(token, users).pipe(Effect.option, Effect.map(Option.map((user) => user.id)));

export const userResponse = (user: User, token: OpaqueToken): UserResponse => ({
  user: {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image,
  },
});
