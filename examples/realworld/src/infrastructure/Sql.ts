import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { RealWorldConfig, type RealWorldConfigService } from "./Config.js";

export const ensureDatabaseDirectory = (
  config: RealWorldConfigService,
): Effect.Effect<void> =>
  Effect.sync(() => mkdirSync(dirname(config.databasePath), { recursive: true }));

export const sqliteLayer = (
  config: RealWorldConfigService,
): Layer.Layer<SqliteClient.SqliteClient | SqlClient.SqlClient> =>
  SqliteClient.layer({
    filename: config.databasePath,
  });

export const withSqlite = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, Exclude<R, SqlClient.SqlClient> | RealWorldConfig> =>
  Effect.gen(function* () {
    const config = yield* RealWorldConfig;
    yield* ensureDatabaseDirectory(config);
    return yield* Effect.provide(effect, sqliteLayer(config));
  });
