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

export class Users extends Context.Service<Users, UsersService>()("@typed/realworld/Users") {
  static readonly Live = Layer.effect(
    Users,
    Effect.gen(function* () {
      const repository = yield* UserRepository;

      return {
        current: Effect.fn(function* (token: Option.Option<OpaqueToken>) {
          const user = yield* requireUser(token, repository);
          return userResponse(user, Option.getOrThrow(token));
        }),
        login: Effect.fn(function* (input: LoginUserRequest) {
          const { email, password } = yield* validateLogin(input);
          const user = yield* repository
            .verifyCredentials(email, password)
            .pipe(Effect.catch(() => Effect.fail(invalidCredentials())));
          if (Option.isNone(user)) return yield* Effect.fail(invalidCredentials());
          return yield* loginResponse(user.value, repository);
        }),
        register: Effect.fn(function* (input: RegisterUserRequest) {
          const user = yield* validateRegister(input);
          const created = yield* repository
            .create(user)
            .pipe(Effect.catch((error) => Effect.fail(mapUserError(error))));
          return yield* loginResponse(created, repository);
        }),
        update: Effect.fn(function* (token: Option.Option<OpaqueToken>, input: UpdateUserRequest) {
          const user = yield* requireUser(token, repository);
          const update = yield* validateUpdate(input);
          const updated = yield* repository
            .update(user.id, update)
            .pipe(Effect.catch((error) => Effect.fail(mapUserError(error))));
          return userResponse(updated, Option.getOrThrow(token));
        }),
      };
    }),
  );
}

const loginResponse = (
  user: User,
  repository: UserRepositoryService,
): Effect.Effect<UserResponse, UsersError> =>
  Effect.gen(function* () {
    const token = yield* repository
      .createSession(user.id)
      .pipe(Effect.catch(() => Effect.fail(tokenInvalid())));
    return userResponse(user, token);
  });

const validateRegister = (
  input: RegisterUserRequest,
): Effect.Effect<RegisterUserRequest["user"], RealWorldError> =>
  Effect.gen(function* () {
    yield* requireNonBlank("username", input.user.username);
    yield* requireNonBlank("email", input.user.email);
    yield* requireNonBlank("password", input.user.password);
    return input.user;
  });

const validateLogin = (
  input: LoginUserRequest,
): Effect.Effect<LoginUserRequest["user"], RealWorldError> =>
  Effect.gen(function* () {
    yield* requireNonBlank("email", input.user.email);
    yield* requireNonBlank("password", input.user.password);
    return input.user;
  });

const validateUpdate = (
  input: UpdateUserRequest,
): Effect.Effect<UpdateUserRequest["user"], RealWorldError> =>
  Effect.gen(function* () {
    if (input.user.password !== undefined && input.user.password.length < 8) {
      return yield* Effect.fail(validationError("password"));
    }
    return input.user;
  });

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
