# API Reference: effect/unstable/persistence/PersistedQueue

- Import path: `effect/unstable/persistence/PersistedQueue`
- Source file: `packages/effect/src/unstable/persistence/PersistedQueue.ts`
- Function exports (callable): 5
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerStoreRedis`
- `layerStoreSql`
- `make`
- `makeStoreRedis`
- `makeStoreSql`

## All Function Signatures

```ts
export declare const layerStoreRedis: (options?: { readonly prefix?: string | undefined; readonly pollInterval?: Duration.Input | undefined; readonly lockRefreshInterval?: Duration.Input | undefined; readonly lockExpiration?: Duration.Input | undefined; } | undefined): Layer.Layer<PersistedQueueStore, never, Redis.Redis>;
export declare const layerStoreSql: (options?: { readonly tableName?: string | undefined; readonly pollInterval?: Duration.Input | undefined; readonly lockRefreshInterval?: Duration.Input | undefined; readonly lockExpiration?: Duration.Input | undefined; } | undefined): Layer.Layer<PersistedQueueStore, SqlError, SqlClient.SqlClient>;
export declare const make: <S extends Schema.Top>(options: { readonly name: string; readonly schema: S; }): Effect.Effect<PersistedQueue<S["Type"], S["EncodingServices"] | S["DecodingServices"]>, never, PersistedQueueFactory>;
export declare const makeStoreRedis: (options?: { readonly prefix?: string | undefined; readonly pollInterval?: Duration.Input | undefined; readonly lockRefreshInterval?: Duration.Input | undefined; readonly lockExpiration?: Duration.Input | undefined; } | undefined): Effect.Effect<{ readonly offer: (options: { readonly name: string; readonly id: string; readonly element: unknown; readonly isCustomId: boolean; }) => Effect.Effect<void, PersistedQueueError>; readonly take: (options: { readonly name: string; readonly maxAttempts: number; }) => Effect.Effect<{ readonly id: string; readonly attempts: number; readonly element: unknown; }, PersistedQueueError, Scope.Scope>; }, never, Scope.Scope | Redis.Redis>;
export declare const makeStoreSql: (options?: { readonly tableName?: string | undefined; readonly pollInterval?: Duration.Input | undefined; readonly lockRefreshInterval?: Duration.Input | undefined; readonly lockExpiration?: Duration.Input | undefined; } | undefined): Effect.Effect<PersistedQueueStore["Service"], SqlError, SqlClient.SqlClient | Scope.Scope>;
```

## Other Exports (Non-Function)

- `ErrorTypeId` (type)
- `layer` (variable)
- `layerStoreMemory` (variable)
- `makeFactory` (variable)
- `PersistedQueue` (interface)
- `PersistedQueueError` (class)
- `PersistedQueueFactory` (class)
- `PersistedQueueStore` (class)
- `TypeId` (type)
