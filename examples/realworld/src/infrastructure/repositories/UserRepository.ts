import { Context, Effect, Layer, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient } from "effect/unstable/sql";
import { Email, OpaqueToken, UserId, Username } from "../../domain/Ids.js";
import { normalizeNullableProfileField, User } from "../../domain/User.js";
import {
  DuplicateUserField,
  PasswordPolicyError,
  UserNotFound,
  type UserRepositoryError,
} from "../../domain/RepositoryErrors.js";
import { PasswordHasher, StoredPassword, type PasswordHasherService } from "../PasswordHasher.js";
import { SessionTokens } from "../SessionTokens.js";
import { currentIsoTimestamp, first, provideRepositorySql } from "./Common.js";

const PasswordMinLength = 8;

export interface CreateUserInput {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserInput {
  readonly username?: string;
  readonly email?: string;
  readonly password?: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

const CreateUserInputSchema = Schema.Struct({
  username: Username,
  email: Email,
  password: Schema.String,
});

const UpdateUserInputSchema = Schema.Struct({
  username: Schema.optionalKey(Username),
  email: Schema.optionalKey(Email),
  password: Schema.optionalKey(Schema.String),
  bio: Schema.optionalKey(Schema.NullOr(Schema.String)),
  image: Schema.optionalKey(Schema.NullOr(Schema.String)),
});

type DecodedCreateUserInput = Schema.Schema.Type<typeof CreateUserInputSchema>;
type DecodedUpdateUserInput = Schema.Schema.Type<typeof UpdateUserInputSchema>;
export type UserRecord = User;

export interface UserRepositoryService {
  readonly create: (input: CreateUserInput) => Effect.Effect<UserRecord, UserRepositoryError>;
  readonly createSession: (userId: UserId) => Effect.Effect<OpaqueToken, UserRepositoryError>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRecord>, UserRepositoryError>;
  readonly findById: (id: UserId) => Effect.Effect<Option.Option<UserRecord>, UserRepositoryError>;
  readonly findByToken: (
    token: string,
  ) => Effect.Effect<Option.Option<UserRecord>, UserRepositoryError>;
  readonly findByUsername: (
    username: string,
  ) => Effect.Effect<Option.Option<UserRecord>, UserRepositoryError>;
  readonly update: (
    id: UserId,
    input: UpdateUserInput,
  ) => Effect.Effect<UserRecord, UserRepositoryError>;
  readonly verifyCredentials: (
    email: string,
    password: string,
  ) => Effect.Effect<Option.Option<UserRecord>, UserRepositoryError>;
}

export class UserRepository extends Context.Service<UserRepository, UserRepositoryService>()(
  "@typed/realworld/UserRepository",
) {
  static readonly Live = Layer.effect(
    UserRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const passwords = yield* PasswordHasher;
      const sessions = yield* SessionTokens;

      return {
        create: (input) => provideRepositorySql(createUser(input, passwords), sql),
        createSession: sessions.create,
        findByEmail: (email) => provideRepositorySql(findByEmail(email), sql),
        findById: (id) => provideRepositorySql(findById(id), sql),
        findByToken: (token) => provideRepositorySql(findByToken(token), sql),
        findByUsername: (username) => provideRepositorySql(findByUsername(username), sql),
        update: (id, input) => provideRepositorySql(updateUser(id, input, passwords), sql),
        verifyCredentials: (email, password) =>
          provideRepositorySql(verifyCredentials(email, password, passwords), sql),
      };
    }),
  );
}

interface UserRow {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly password_hash: string;
  readonly password_salt: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

const createUser = (
  rawInput: CreateUserInput,
  passwords: PasswordHasherService,
): Effect.Effect<UserRecord, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const input = yield* decodeCreateUserInput(rawInput);
    yield* assertPasswordAllowed(input.password);
    const stored = yield* passwords.hash(input.password);
    const sql = yield* SqlClient.SqlClient;

    return yield* sql.withTransaction(
      Effect.gen(function* () {
        yield* assertUniqueUsername(input.username, 0);
        yield* assertUniqueEmail(input.email, 0);
        return yield* insertUser(input, stored);
      }),
    );
  });

const updateUser = (
  id: UserId,
  rawInput: UpdateUserInput,
  passwords: PasswordHasherService,
): Effect.Effect<UserRecord, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const input = yield* decodeUpdateUserInput(rawInput);
    yield* assertOptionalPasswordAllowed(input.password);
    const current = yield* requireUserRow(id);
    const stored = yield* resolveUpdatedPassword(current, input, passwords);

    yield* assertUpdateIsUnique(id, input);
    return yield* updateUserRow(id, current, input, stored);
  });

const verifyCredentials = (
  email: string,
  password: string,
  passwords: PasswordHasherService,
): Effect.Effect<Option.Option<UserRecord>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknownEffect(Email)(email);
    const row = yield* selectUserRowByEmail(decoded);
    if (Option.isNone(row)) return Option.none();

    const stored = yield* toStoredPassword(row.value);
    const verified = yield* passwords.verify(password, stored);
    const user = yield* toUser(row.value);
    return verified ? Option.some(user) : Option.none();
  });

const insertUser = (
  input: DecodedCreateUserInput,
  stored: StoredPassword,
): Effect.Effect<UserRecord, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const now = currentIsoTimestamp();
    const [row] = yield* sql<UserRow>`
      INSERT INTO users
        (username, email, password_hash, password_salt, bio, image, created_at, updated_at)
      VALUES
        (${input.username}, ${input.email}, ${stored.passwordHash},
         ${stored.passwordSalt}, ${null}, ${null}, ${now}, ${now})
      RETURNING *
    `;

    return yield* toUser(row);
  });

const updateUserRow = (
  id: UserId,
  current: UserRow,
  input: DecodedUpdateUserInput,
  stored: StoredPassword,
): Effect.Effect<UserRecord, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const [row] = yield* sql<UserRow>`
      UPDATE users
      SET username = ${input.username ?? current.username},
          email = ${input.email ?? current.email},
          password_hash = ${stored.passwordHash},
          password_salt = ${stored.passwordSalt},
          bio = ${resolveNullableUpdate(input, "bio", current.bio)},
          image = ${resolveNullableUpdate(input, "image", current.image)},
          updated_at = ${currentIsoTimestamp()}
      WHERE id = ${id}
      RETURNING *
    `;

    return yield* toUser(row);
  });

const findById = (
  id: UserId,
): Effect.Effect<Option.Option<UserRecord>, UserRepositoryError, SqlClient.SqlClient> =>
  selectUserRowById(id).pipe(Effect.flatMap(decodeUserOption));

const findByEmail = (
  email: string,
): Effect.Effect<Option.Option<UserRecord>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknownEffect(Email)(email);
    const row = yield* selectUserRowByEmail(decoded);
    return yield* decodeUserOption(row);
  });

const findByUsername = (
  username: string,
): Effect.Effect<Option.Option<UserRecord>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknownEffect(Username)(username);
    const row = yield* selectUserRowByUsername(decoded);
    return yield* decodeUserOption(row);
  });

const findByToken = (
  token: string,
): Effect.Effect<Option.Option<UserRecord>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const decoded = yield* Schema.decodeUnknownEffect(OpaqueToken)(token);
    const rows = yield* sql<UserRow>`
      SELECT users.*
      FROM users
      INNER JOIN sessions ON sessions.user_id = users.id
      WHERE sessions.token = ${decoded}
      LIMIT 1
    `;

    return yield* decodeUserOption(first(rows));
  });

const assertUpdateIsUnique = (
  id: UserId,
  input: DecodedUpdateUserInput,
): Effect.Effect<void, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    if (input.username !== undefined) yield* assertUniqueUsername(input.username, id);
    if (input.email !== undefined) yield* assertUniqueEmail(input.email, id);
  });

const assertUniqueUsername = (
  username: Username,
  excludingId: number,
): Effect.Effect<void, UserRepositoryError, SqlClient.SqlClient> =>
  selectUserRowByUsername(username, excludingId).pipe(
    Effect.flatMap((row) =>
      Option.isSome(row) ? Effect.fail(new DuplicateUserField({ field: "username" })) : Effect.void,
    ),
  );

const assertUniqueEmail = (
  email: Email,
  excludingId: number,
): Effect.Effect<void, UserRepositoryError, SqlClient.SqlClient> =>
  selectUserRowByEmail(email, excludingId).pipe(
    Effect.flatMap((row) =>
      Option.isSome(row) ? Effect.fail(new DuplicateUserField({ field: "email" })) : Effect.void,
    ),
  );

const requireUserRow = (
  id: UserId,
): Effect.Effect<UserRow, UserRepositoryError, SqlClient.SqlClient> =>
  selectUserRowById(id).pipe(
    Effect.flatMap((row) =>
      Option.isSome(row) ? Effect.succeed(row.value) : Effect.fail(new UserNotFound({ id })),
    ),
  );

const selectUserRowById = (
  id: UserId,
): Effect.Effect<Option.Option<UserRow>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<UserRow>`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return first(rows);
  });

const selectUserRowByUsername = (
  username: Username,
  excludingId = 0,
): Effect.Effect<Option.Option<UserRow>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<UserRow>`
      SELECT * FROM users
      WHERE username = ${username} AND id <> ${excludingId}
      LIMIT 1
    `;
    return first(rows);
  });

const selectUserRowByEmail = (
  email: Email,
  excludingId = 0,
): Effect.Effect<Option.Option<UserRow>, UserRepositoryError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<UserRow>`
      SELECT * FROM users
      WHERE email = ${email} AND id <> ${excludingId}
      LIMIT 1
    `;
    return first(rows);
  });

const resolveUpdatedPassword = (
  current: UserRow,
  input: DecodedUpdateUserInput,
  passwords: PasswordHasherService,
): Effect.Effect<StoredPassword, UserRepositoryError> =>
  input.password === undefined ? toStoredPassword(current) : passwords.hash(input.password);

const assertOptionalPasswordAllowed = (
  password: string | undefined,
): Effect.Effect<void, PasswordPolicyError> =>
  password === undefined ? Effect.void : assertPasswordAllowed(password);

const assertPasswordAllowed = (password: string): Effect.Effect<void, PasswordPolicyError> =>
  password.length >= PasswordMinLength
    ? Effect.void
    : Effect.fail(new PasswordPolicyError({ reason: "Password must be at least 8 characters" }));

const resolveNullableUpdate = (
  input: DecodedUpdateUserInput,
  field: "bio" | "image",
  current: string | null,
): string | null =>
  Object.prototype.hasOwnProperty.call(input, field)
    ? normalizeNullableProfileField(input[field])
    : current;

const decodeCreateUserInput = (
  input: CreateUserInput,
): Effect.Effect<DecodedCreateUserInput, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(CreateUserInputSchema)(input);

const decodeUpdateUserInput = (
  input: UpdateUserInput,
): Effect.Effect<DecodedUpdateUserInput, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(UpdateUserInputSchema)(input);

const toStoredPassword = (row: UserRow): Effect.Effect<StoredPassword, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(StoredPassword)({
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
  });

const toUser = (row: UserRow): Effect.Effect<UserRecord, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(User)({
    id: row.id,
    username: row.username,
    email: row.email,
    bio: row.bio,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const decodeUserOption = (
  row: Option.Option<UserRow>,
): Effect.Effect<Option.Option<UserRecord>, Schema.SchemaError> =>
  Option.isSome(row) ? Effect.map(toUser(row.value), Option.some) : Effect.succeed(Option.none());
