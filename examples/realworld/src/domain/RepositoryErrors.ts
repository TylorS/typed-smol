import { Data } from "effect";
import * as Schema from "effect/Schema";
import { Migrator, SqlError } from "effect/unstable/sql";
import type { UserId } from "./Ids.js";

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly operation: "mkdir" | "rm";
  readonly path: string;
  readonly reason: string;
}> {}

export const formatThrown = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export type RepositoryPersistenceError = FileSystemError | Schema.SchemaError | SqlError.SqlError;

export type DatabaseError = FileSystemError | Migrator.MigrationError | SqlError.SqlError;

export class PasswordHashError extends Data.TaggedError("PasswordHashError")<{
  readonly reason: string;
}> {}

export type SessionTokenError = RepositoryPersistenceError;

export class ArticleRepositoryInvariantError extends Data.TaggedError(
  "ArticleRepositoryInvariantError",
)<{
  readonly message: string;
}> {}

export type ArticleRepositoryError = ArticleRepositoryInvariantError | RepositoryPersistenceError;

export type CommentRepositoryError = RepositoryPersistenceError;

export type ProfileRepositoryError = RepositoryPersistenceError;

export type TagRepositoryError = RepositoryPersistenceError;

export class DuplicateUserField extends Data.TaggedError("DuplicateUserField")<{
  readonly field: "username" | "email";
}> {}

export class PasswordPolicyError extends Data.TaggedError("PasswordPolicyError")<{
  readonly reason: string;
}> {}

export class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly id: UserId;
}> {}

export type UserRepositoryError =
  | DuplicateUserField
  | PasswordHashError
  | PasswordPolicyError
  | RepositoryPersistenceError
  | SessionTokenError
  | UserNotFound;
