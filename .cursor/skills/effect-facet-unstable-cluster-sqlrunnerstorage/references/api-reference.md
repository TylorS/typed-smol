# API Reference: effect/unstable/cluster/SqlRunnerStorage

- Import path: `effect/unstable/cluster/SqlRunnerStorage`
- Source file: `packages/effect/src/unstable/cluster/SqlRunnerStorage.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerWith`
- `make`

## All Function Signatures

```ts
export declare const layerWith: (options: { readonly prefix?: string | undefined; }): Layer.Layer<RunnerStorage.RunnerStorage, SqlError, SqlClient.SqlClient | ShardingConfig.ShardingConfig>;
export declare const make: (options: { readonly prefix?: string | undefined; }): Effect.Effect<{ readonly register: (runner: Runner, healthy: boolean) => Effect.Effect<MachineId, PersistenceError>; readonly unregister: (address: RunnerAddress) => Effect.Effect<void, PersistenceError>; readonly getRunners: Effect.Effect<Array<readonly [runner: Runner, healthy: boolean]>, PersistenceError>; readonly setRunnerHealth: (address: RunnerAddress, healthy: boolean) => Effect.Effect<void, PersistenceError>; readonly acquire: (address: RunnerAddress, shardIds: Iterable<ShardId.ShardId>) => Effect.Effect<Array<ShardId.ShardId>, PersistenceError>; readonly refresh: (address: RunnerAddress, shardIds: Iterable<ShardId.ShardId>) => Effect.Effect<Array<ShardId.ShardId>, PersistenceError>; readonly release: (address: RunnerAddress, shardId: ShardId.ShardId) => Effect.Effect<void, PersistenceError>; readonly releaseAll: (address: RunnerAddress) => Effect.Effect<void, PersistenceError>; }, SqlError, Scope.Scope | ShardingConfig.ShardingConfig | SqlClient.SqlClient>;
```

## Other Exports (Non-Function)

- `layer` (variable)
