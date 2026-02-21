# API Reference: effect/unstable/persistence/PersistedCache

- Import path: `effect/unstable/persistence/PersistedCache`
- Source file: `packages/effect/src/unstable/persistence/PersistedCache.ts`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: <K extends Persistable.Any, R = never, ServiceMode extends "lookup" | "construction" = never>(options: { readonly storeId: string; readonly lookup: (key: K) => Effect.Effect<Persistable.Success<K>, Persistable.Error<K>, R>; readonly timeToLive: Persistable.TimeToLiveFn<K>; readonly inMemoryCapacity?: number | undefined; readonly inMemoryTTL?: Persistable.TimeToLiveFn<K> | undefined; readonly requireServicesAt?: ServiceMode | undefined; }): Effect.Effect<PersistedCache<K, "lookup" extends ServiceMode ? R : never>, never, ("lookup" extends ServiceMode ? never : R) | Persistence.Persistence | Scope.Scope>;
```

## Other Exports (Non-Function)

- `PersistedCache` (interface)
