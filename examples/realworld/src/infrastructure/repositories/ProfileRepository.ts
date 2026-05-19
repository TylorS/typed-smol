import { Context, Effect, Layer, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { UserId, Username } from "../../domain/Ids.js";
import { Profile } from "../../domain/User.js";
import {
  currentIsoTimestamp,
  first,
  provideRepositorySql,
  type RepositoryPersistenceError,
} from "./Common.js";

export type ProfileRepositoryError = RepositoryPersistenceError;

export interface ProfileRepositoryService {
  readonly findByUsername: (
    username: string,
    viewerId: Option.Option<UserId>,
  ) => Effect.Effect<Option.Option<Profile>, ProfileRepositoryError>;
  readonly follow: (
    followerId: UserId,
    username: string,
  ) => Effect.Effect<Option.Option<Profile>, ProfileRepositoryError>;
  readonly unfollow: (
    followerId: UserId,
    username: string,
  ) => Effect.Effect<Option.Option<Profile>, ProfileRepositoryError>;
}

export class ProfileRepository extends Context.Service<
  ProfileRepository,
  ProfileRepositoryService
>()("@typed/realworld/ProfileRepository") {
  static readonly Live = Layer.effect(
    ProfileRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      return {
        findByUsername: (username, viewerId) =>
          provideRepositorySql(findByUsername(username, viewerId), sql),
        follow: (followerId, username) =>
          provideRepositorySql(followProfile(followerId, username), sql),
        unfollow: (followerId, username) =>
          provideRepositorySql(unfollowProfile(followerId, username), sql),
      };
    }),
  );
}

interface ProfileRow {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: number;
}

const findByUsername = (
  rawUsername: string,
  viewerId: Option.Option<UserId>,
): Effect.Effect<Option.Option<Profile>, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const username = yield* Schema.decodeUnknownEffect(Username)(rawUsername);
    const row = yield* selectProfileRow(username, Option.getOrUndefined(viewerId) ?? 0);
    return yield* decodeProfileOption(row);
  });

const followProfile = (
  followerId: UserId,
  rawUsername: string,
): Effect.Effect<Option.Option<Profile>, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const username = yield* Schema.decodeUnknownEffect(Username)(rawUsername);
    const targetId = yield* selectUserIdByUsername(username);
    if (Option.isNone(targetId)) return Option.none();

    if (targetId.value !== followerId) yield* insertFollow(followerId, targetId.value);
    return yield* findByUsername(username, Option.some(followerId));
  });

const unfollowProfile = (
  followerId: UserId,
  rawUsername: string,
): Effect.Effect<Option.Option<Profile>, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const username = yield* Schema.decodeUnknownEffect(Username)(rawUsername);
    const targetId = yield* selectUserIdByUsername(username);
    if (Option.isNone(targetId)) return Option.none();

    yield* deleteFollow(followerId, targetId.value);
    return yield* findByUsername(username, Option.some(followerId));
  });

const selectProfileRow = (
  username: Username,
  viewerId: number,
): Effect.Effect<Option.Option<ProfileRow>, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<ProfileRow>`
      SELECT users.username, users.bio, users.image,
             EXISTS(
               SELECT 1 FROM follows
               WHERE follower_id = ${viewerId} AND followed_id = users.id
             ) AS following
      FROM users
      WHERE users.username = ${username}
      LIMIT 1
    `;

    return first(rows);
  });

const selectUserIdByUsername = (
  username: Username,
): Effect.Effect<Option.Option<UserId>, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{ readonly id: number }>`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;

    const row = first(rows);
    if (Option.isNone(row)) return Option.none();

    const id = yield* Schema.decodeUnknownEffect(UserId)(row.value.id);
    return Option.some(id);
  });

const insertFollow = (
  followerId: UserId,
  followedId: UserId,
): Effect.Effect<void, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at)
      VALUES (${followerId}, ${followedId}, ${currentIsoTimestamp()})
    `;
  });

const deleteFollow = (
  followerId: UserId,
  followedId: UserId,
): Effect.Effect<void, ProfileRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      DELETE FROM follows
      WHERE follower_id = ${followerId} AND followed_id = ${followedId}
    `;
  });

const toProfile = (row: ProfileRow): Effect.Effect<Profile, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(Profile)({
    username: row.username,
    bio: row.bio,
    image: row.image,
    following: Boolean(row.following),
  });

const decodeProfileOption = (
  row: Option.Option<ProfileRow>,
): Effect.Effect<Option.Option<Profile>, Schema.SchemaError> =>
  Option.isSome(row)
    ? Effect.map(toProfile(row.value), Option.some)
    : Effect.succeed(Option.none());
