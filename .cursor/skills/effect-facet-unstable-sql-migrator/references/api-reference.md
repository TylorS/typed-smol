# API Reference: effect/unstable/sql/Migrator

- Import path: `effect/unstable/sql/Migrator`
- Source file: `packages/effect/src/unstable/sql/Migrator.ts`
- Function exports (callable): 5
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromBabelGlob`
- `fromFileSystem`
- `fromGlob`
- `fromRecord`
- `make`

## All Function Signatures

```ts
export declare const fromBabelGlob: (migrations: Record<string, any>): Loader;
export declare const fromFileSystem: (directory: string): Loader<FileSystem>;
export declare const fromGlob: (migrations: Record<string, () => Promise<any>>): Loader;
export declare const fromRecord: (migrations: Record<string, Effect.Effect<void, unknown, Client.SqlClient>>): Loader;
export declare const make: <RD = never>({ dumpSchema }: { dumpSchema?: (path: string, migrationsTable: string) => Effect.Effect<void, MigrationError, RD>; }): <R2 = never>({ loader, schemaDirectory, table }: MigratorOptions<R2>) => Effect.Effect<ReadonlyArray<readonly [id: number, name: string]>, MigrationError | SqlError, Client.SqlClient | RD | R2>;
```

## Other Exports (Non-Function)

- `Loader` (type)
- `Migration` (interface)
- `MigrationError` (class)
- `MigratorOptions` (interface)
- `ResolvedMigration` (type)
