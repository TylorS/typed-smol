import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { Context, Effect, Layer } from "effect";
import { RealWorldConfig } from "./Config.js";
import { FileSystemError, formatThrown, type DatabaseError } from "../domain/RepositoryErrors.js";
import { runMigrations } from "./Migrations.js";
import { collectSeedCounts, seedDatabase, type SeedCounts } from "./Seed.js";
import { ensureDatabaseDirectory, sqliteLayer, withSqlite } from "./Sql.js";

export interface DatabaseManagerService {
  readonly migrate: Effect.Effect<void, DatabaseError>;
  readonly seed: Effect.Effect<SeedCounts, DatabaseError>;
  readonly reset: Effect.Effect<SeedCounts, DatabaseError>;
  readonly counts: Effect.Effect<SeedCounts, DatabaseError>;
}

export class DatabaseManager extends Context.Service<DatabaseManager, DatabaseManagerService>()(
  "@typed/realworld/DatabaseManager",
) {
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
  migrate: Effect.Effect<void, DatabaseError>,
  seed: Effect.Effect<SeedCounts, DatabaseError>,
): Effect.Effect<SeedCounts, DatabaseError> =>
  removeDatabase(databasePath).pipe(Effect.andThen(migrate), Effect.andThen(seed));

const removeDatabase = (databasePath: string): Effect.Effect<void, FileSystemError> =>
  Effect.try({
    try: () => {
      rmSync(databasePath, { force: true });
      mkdirSync(dirname(databasePath), { recursive: true });
    },
    catch: (cause) =>
      new FileSystemError({
        operation: "rm",
        path: databasePath,
        reason: formatThrown(cause),
      }),
  });
