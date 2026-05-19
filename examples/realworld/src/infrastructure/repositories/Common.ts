import { Effect, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient, SqlError } from "effect/unstable/sql";
import { FileSystemError } from "../Errors.js";

export type RepositoryPersistenceError =
  | FileSystemError
  | Schema.SchemaError
  | SqlError.SqlError;

export const provideRepositorySql = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  sql: SqlClient.SqlClient,
): Effect.Effect<A, E, Exclude<R, SqlClient.SqlClient>> =>
  Effect.provideService(effect, SqlClient.SqlClient, sql);

export const first = <A>(rows: readonly A[]): Option.Option<A> =>
  rows.length > 0 ? Option.some(rows[0]) : Option.none();

export const currentIsoTimestamp = (): string => new Date().toISOString();
