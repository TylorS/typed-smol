# API Reference: effect/unstable/persistence/Persistence

- Import path: `effect/unstable/persistence/Persistence`
- Source file: `packages/effect/src/unstable/persistence/Persistence.ts`
- Function exports (callable): 1
- Non-function exports: 16

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `unsafeTtlToExpires`

## All Function Signatures

```ts
export declare const unsafeTtlToExpires: (clock: Clock.Clock, ttl: Duration.Duration | undefined): number | null;
```

## Other Exports (Non-Function)

- `BackingPersistence` (class)
- `BackingPersistenceStore` (interface)
- `layer` (variable)
- `layerBackingKvs` (variable)
- `layerBackingMemory` (variable)
- `layerBackingRedis` (variable)
- `layerBackingSql` (variable)
- `layerBackingSqlMultiTable` (variable)
- `layerKvs` (variable)
- `layerMemory` (variable)
- `layerRedis` (variable)
- `layerSql` (variable)
- `layerSqlMultiTable` (variable)
- `Persistence` (class)
- `PersistenceError` (class)
- `PersistenceStore` (interface)
