# API Reference: effect/unstable/cluster/RunnerStorage

- Import path: `effect/unstable/cluster/RunnerStorage`
- Source file: `packages/effect/src/unstable/cluster/RunnerStorage.ts`
- Function exports (callable): 1
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `makeEncoded`

## All Function Signatures

```ts
export declare const makeEncoded: (encoded: Encoded): { readonly register: (runner: Runner, healthy: boolean) => Effect.Effect<MachineId.MachineId, PersistenceError>; readonly unregister: (address: RunnerAddress) => Effect.Effect<void, PersistenceError>; readonly getRunners: Effect.Effect<Array<readonly [runner: Runner, healthy: boolean]>, PersistenceError>; readonly setRunnerHealth: (address: RunnerAddress, healthy: boolean) => Effect.Effect<void, PersistenceError>; readonly acquire: (address: RunnerAddress, shardIds: Iterable<ShardId>) => Effect.Effect<Array<ShardId>, PersistenceError>; readonly refresh: (address: RunnerAddress, shardIds: Iterable<ShardId>) => Effect.Effect<Array<ShardId>, PersistenceError>; readonly release: (address: RunnerAddress, shardId: ShardId) => Effect.Effect<void, PersistenceError>; readonly releaseAll: (address: RunnerAddress) => Effect.Effect<void, PersistenceError>; };
```

## Other Exports (Non-Function)

- `Encoded` (interface)
- `layerMemory` (variable)
- `makeMemory` (variable)
- `RunnerStorage` (class)
