import { Context, Effect, Layer, Option } from "effect";
import type { OpaqueToken } from "../domain/Ids.js";
import type { ProfileResponse } from "../domain/RealWorldApi.js";
import type { RealWorldError } from "../domain/Errors.js";
import type { ProfileRepositoryError, UserRepositoryError } from "../domain/RepositoryErrors.js";
import { ProfileRepository } from "../infrastructure/repositories/ProfileRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";
import { notFound, optionalUserId, requireUser } from "./Common.js";

type ProfilesError = RealWorldError | ProfileRepositoryError | UserRepositoryError;

export interface ProfilesService {
  readonly follow: (
    token: Option.Option<OpaqueToken>,
    username: string,
  ) => Effect.Effect<ProfileResponse, ProfilesError>;
  readonly get: (
    username: string,
    token: Option.Option<OpaqueToken>,
  ) => Effect.Effect<ProfileResponse, ProfilesError>;
  readonly unfollow: (
    token: Option.Option<OpaqueToken>,
    username: string,
  ) => Effect.Effect<ProfileResponse, ProfilesError>;
}

export class Profiles extends Context.Service<Profiles, ProfilesService>()(
  "@typed/realworld/Profiles",
) {
  static readonly Live = Layer.effect(
    Profiles,
    Effect.gen(function* () {
      const profiles = yield* ProfileRepository;
      const users = yield* UserRepository;

      return {
        follow: Effect.fn(function* (token: Option.Option<OpaqueToken>, username: string) {
          const user = yield* requireUser(token, users);
          const profile = yield* profiles.follow(user.id, username);
          return yield* toProfileResponse(profile);
        }),
        get: Effect.fn(function* (username: string, token: Option.Option<OpaqueToken>) {
          const viewer = yield* optionalUserId(token, users);
          const profile = yield* profiles.findByUsername(username, viewer);
          return yield* toProfileResponse(profile);
        }),
        unfollow: Effect.fn(function* (token: Option.Option<OpaqueToken>, username: string) {
          const user = yield* requireUser(token, users);
          const profile = yield* profiles.unfollow(user.id, username);
          return yield* toProfileResponse(profile);
        }),
      };
    }),
  );
}

const toProfileResponse = (profile: Option.Option<ProfileResponse["profile"]>) =>
  Effect.gen(function* () {
    if (Option.isNone(profile)) return yield* Effect.fail(notFound("profile"));
    return { profile: profile.value };
  });
