import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { Effect, Layer } from "effect";
import { SqlClient, SqlError } from "effect/unstable/sql";
import { RealWorldConfig, type RealWorldConfigService } from "./Config.js";
import { FileSystemError, formatThrown } from "./Errors.js";

export const ensureDatabaseDirectory = (
  config: RealWorldConfigService,
): Effect.Effect<void, FileSystemError> => {
  const path = dirname(config.databasePath);
  return Effect.try({
    try: () => mkdirSync(path, { recursive: true }),
    catch: (cause) =>
      new FileSystemError({ operation: "mkdir", path, reason: formatThrown(cause) }),
  });
};

export const sqliteLayer = (
  config: RealWorldConfigService,
): Layer.Layer<SqliteClient.SqliteClient | SqlClient.SqlClient> =>
  SqliteClient.layer({
    filename: config.databasePath,
  });

export const withSqlite = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<
  A,
  E | FileSystemError | SqlError.SqlError,
  Exclude<R, SqlClient.SqlClient> | RealWorldConfig
> =>
  Effect.gen(function* () {
    const config = yield* RealWorldConfig;
    yield* ensureDatabaseDirectory(config);
    return yield* Effect.provide(effect, sqliteLayer(config));
  });
