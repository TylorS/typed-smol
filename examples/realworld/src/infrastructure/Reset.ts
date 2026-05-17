import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { Context, Effect, Layer } from "effect";
import { RealWorldConfig } from "./Config.js";
import { runMigrations } from "./Migrations.js";
import { collectSeedCounts, seedDatabase, type SeedCounts } from "./Seed.js";
import { ensureDatabaseDirectory, sqliteLayer, withSqlite } from "./Sql.js";

export interface DatabaseManagerService {
  readonly migrate: Effect.Effect<void, unknown>;
  readonly seed: Effect.Effect<SeedCounts, unknown>;
  readonly reset: Effect.Effect<SeedCounts, unknown>;
  readonly counts: Effect.Effect<SeedCounts, unknown>;
}

export class DatabaseManager extends Context.Service<
  DatabaseManager,
  DatabaseManagerService
>()("@typed/realworld/DatabaseManager") {
  static readonly Live = Layer.effect(
    DatabaseManager,
    Effect.gen(function* () {
      const config = yield* RealWorldConfig;
      const run = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.provide(effect, sqliteLayer(config));

      const migrate = run(runMigrations).pipe(Effect.asVoid);
      const seed = run(seedDatabase);
      const counts = run(collectSeedCounts);

      return {
        migrate: ensureDatabaseDirectory(config).pipe(Effect.andThen(migrate)),
        seed: ensureDatabaseDirectory(config).pipe(Effect.andThen(seed)),
        counts: ensureDatabaseDirectory(config).pipe(Effect.andThen(counts)),
        reset: resetWithConfig(config.databasePath, migrate, seed),
      };
    }),
  );
}

export const migrateDatabase = DatabaseManager.use((database) => database.migrate).pipe(
  Effect.provide(DatabaseManager.Live),
);

export const seedConfiguredDatabase = DatabaseManager.use((database) => database.seed).pipe(
  Effect.provide(DatabaseManager.Live),
);

export const resetDatabase = DatabaseManager.use((database) => database.reset).pipe(
  Effect.provide(DatabaseManager.Live),
);

export const collectConfiguredSeedCounts = withSqlite(collectSeedCounts);

const resetWithConfig = (
  databasePath: string,
  migrate: Effect.Effect<void, unknown>,
  seed: Effect.Effect<SeedCounts, unknown>,
): Effect.Effect<SeedCounts, unknown> =>
  Effect.sync(() => {
    rmSync(databasePath, { force: true });
    mkdirSync(dirname(databasePath), { recursive: true });
  }).pipe(
    Effect.andThen(migrate),
    Effect.andThen(seed),
  );
