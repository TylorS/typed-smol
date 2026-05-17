import { Effect, Option } from "effect";
import * as Schema from "effect/Schema";
import { SqlClient, SqlError } from "effect/unstable/sql";
import type { RealWorldConfigService } from "../Config.js";
import { FileSystemError } from "../Errors.js";
import { ensureDatabaseDirectory, sqliteLayer } from "../Sql.js";

export type RepositoryPersistenceError =
  | FileSystemError
  | Schema.SchemaError
  | SqlError.SqlError;

export const runSql = <A, E, R>(
  config: RealWorldConfigService,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E | FileSystemError | SqlError.SqlError, Exclude<R, SqlClient.SqlClient>> =>
  ensureDatabaseDirectory(config).pipe(
    Effect.andThen(Effect.provide(effect, sqliteLayer(config))),
  );

export const first = <A>(rows: readonly A[]): Option.Option<A> =>
  rows.length > 0 ? Option.some(rows[0]) : Option.none();

export const currentIsoTimestamp = (): string => new Date().toISOString();
