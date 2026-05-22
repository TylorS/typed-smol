import { Context, Effect, Layer, Option } from "effect";
import type { OpaqueToken } from "../domain/Ids.js";
import type {
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../domain/RealWorldApi.js";
import type { RealWorldError } from "../domain/Errors.js";
import type { UserRepositoryError } from "../domain/RepositoryErrors.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import {
  duplicate,
  invalidCredentials,
  requireNonBlank,
  requireUser,
  tokenInvalid,
  userResponse,
  validationError,
} from "./Common.js";
import type { User } from "../domain/User.js";
import type { UserRepositoryService } from "../infrastructure/repositories/UserRepository.js";

type UsersError = RealWorldError | UserRepositoryError;

export interface UsersService {
  readonly current: (token: Option.Option<OpaqueToken>) => Effect.Effect<UserResponse, UsersError>;
  readonly login: (input: LoginUserRequest) => Effect.Effect<UserResponse, UsersError>;
  readonly register: (input: RegisterUserRequest) => Effect.Effect<UserResponse, UsersError>;
  readonly update: (
    token: Option.Option<OpaqueToken>,
    input: UpdateUserRequest,
  ) => Effect.Effect<UserResponse, UsersError>;
}

export class Users extends Context.Service<Users, UsersService>()(
  "@typed/realworld/Users",
) {
  static readonly Live = Layer.effect(
    Users,
    Effect.gen(function* () {
      const repository = yield* UserRepository;

      return {
        current: (token) =>
          requireUser(token, repository).pipe(
            Effect.map((user) => userResponse(user, Option.getOrThrow(token))),
          ),
        login: (input) =>
          validateLogin(input).pipe(
            Effect.flatMap(({ email, password }) =>
              repository.verifyCredentials(email, password).pipe(
                Effect.catch(() => Effect.fail(invalidCredentials())),
              ),
            ),
            Effect.flatMap((user) =>
              Option.isSome(user) ? loginResponse(user.value, repository) : Effect.fail(invalidCredentials()),
            ),
          ),
        register: (input) =>
          validateRegister(input).pipe(
            Effect.flatMap((user) =>
              repository.create(user).pipe(
                Effect.catch((error) => Effect.fail(mapUserError(error))),
              ),
            ),
            Effect.flatMap((user) => loginResponse(user, repository)),
          ),
        update: (token, input) =>
          requireUser(token, repository).pipe(
            Effect.flatMap((user) =>
              validateUpdate(input).pipe(
                Effect.flatMap((update) =>
                  repository.update(user.id, update).pipe(
                    Effect.catch((error) => Effect.fail(mapUserError(error))),
                  ),
                ),
                Effect.map((updated) => userResponse(updated, Option.getOrThrow(token))),
              ),
            ),
          ),
      };
    }),
  );
}

const loginResponse = (
  user: User,
  repository: UserRepositoryService,
): Effect.Effect<UserResponse, UsersError> =>
  repository.createSession(user.id).pipe(
    Effect.catch(() => Effect.fail(tokenInvalid())),
    Effect.map((token) => userResponse(user, token)),
  );

const validateRegister = (
  input: RegisterUserRequest,
): Effect.Effect<RegisterUserRequest["user"], RealWorldError> =>
  Effect.all([
    requireNonBlank("username", input.user.username),
    requireNonBlank("email", input.user.email),
    requireNonBlank("password", input.user.password),
  ], { concurrency: "unbounded" }).pipe(Effect.as(input.user));

const validateLogin = (
  input: LoginUserRequest,
): Effect.Effect<LoginUserRequest["user"], RealWorldError> =>
  Effect.all([
    requireNonBlank("email", input.user.email),
    requireNonBlank("password", input.user.password),
  ], { concurrency: "unbounded" }).pipe(Effect.as(input.user));

const validateUpdate = (
  input: UpdateUserRequest,
): Effect.Effect<UpdateUserRequest["user"], RealWorldError> =>
  input.user.password !== undefined && input.user.password.length < 8
    ? Effect.fail(validationError("password"))
    : Effect.succeed(input.user);

const mapUserError = (error: UserRepositoryError): RealWorldError => {
  if (isTagged(error, "DuplicateUserField")) return duplicate(error.field);
  if (isTagged(error, "PasswordPolicyError")) return validationError("password");
  return validationError("user");
};

const isTagged = <T extends string>(
  error: unknown,
  tag: T,
): error is { readonly _tag: T; readonly field: string } =>
  typeof error === "object" && error !== null && "_tag" in error && error._tag === tag;
