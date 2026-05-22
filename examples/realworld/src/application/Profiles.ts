import { Context, Effect, Layer, Option } from "effect";
import type { OpaqueToken } from "../domain/Ids.js";
import type { ProfileResponse } from "../domain/RealWorldApi.js";
import type { RealWorldError } from "../domain/Errors.js";
import type {
  ProfileRepositoryError,
  UserRepositoryError,
} from "../domain/RepositoryErrors.js";
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
        follow: (token, username) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) => profiles.follow(user.id, username)),
            Effect.flatMap(profileResponse),
          ),
        get: (username, token) =>
          optionalUserId(token, users).pipe(
            Effect.flatMap((viewer) => profiles.findByUsername(username, viewer)),
            Effect.flatMap(profileResponse),
          ),
        unfollow: (token, username) =>
          requireUser(token, users).pipe(
            Effect.flatMap((user) => profiles.unfollow(user.id, username)),
            Effect.flatMap(profileResponse),
          ),
      };
    }),
  );
}

const profileResponse = (profile: Option.Option<ProfileResponse["profile"]>) =>
  Option.isSome(profile)
    ? Effect.succeed({ profile: profile.value })
    : Effect.fail(notFound("profile"));
