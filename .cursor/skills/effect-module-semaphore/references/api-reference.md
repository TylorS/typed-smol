# API Reference: effect/Semaphore

- Import path: `effect/Semaphore`
- Source file: `packages/effect/src/Semaphore.ts`
- Function exports (callable): 4
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `makePartitioned`
- `makePartitionedUnsafe`
- `makeUnsafe`

## All Function Signatures

```ts
export declare const make: (permits: number): Effect.Effect<Semaphore>;
export declare const makePartitioned: <K = unknown>(options: { readonly permits: number; }): Effect.Effect<Partitioned<K>>;
export declare const makePartitionedUnsafe: <K = unknown>(options: { readonly permits: number; }): Partitioned<K>;
export declare const makeUnsafe: (permits: number): Semaphore;
```

## Other Exports (Non-Function)

- `Partitioned` (interface)
- `PartitionedTypeId` (type)
- `Semaphore` (interface)
