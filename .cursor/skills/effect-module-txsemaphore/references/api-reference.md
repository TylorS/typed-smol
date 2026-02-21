# API Reference: effect/TxSemaphore

- Import path: `effect/TxSemaphore`
- Source file: `packages/effect/src/TxSemaphore.ts`
- Function exports (callable): 13
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `acquire`
- `acquireN`
- `available`
- `capacity`
- `isTxSemaphore`
- `make`
- `release`
- `releaseN`
- `tryAcquire`
- `tryAcquireN`
- `withPermit`
- `withPermits`
- `withPermitScoped`

## All Function Signatures

```ts
export declare const acquire: (self: TxSemaphore): Effect.Effect<void>;
export declare const acquireN: (self: TxSemaphore, n: number): Effect.Effect<void>;
export declare const available: (self: TxSemaphore): Effect.Effect<number>;
export declare const capacity: (self: TxSemaphore): Effect.Effect<number>;
export declare const isTxSemaphore: (u: unknown): u is TxSemaphore;
export declare const make: (permits: number): Effect.Effect<TxSemaphore>;
export declare const release: (self: TxSemaphore): Effect.Effect<void>;
export declare const releaseN: (self: TxSemaphore, n: number): Effect.Effect<void>;
export declare const tryAcquire: (self: TxSemaphore): Effect.Effect<boolean>;
export declare const tryAcquireN: (self: TxSemaphore, n: number): Effect.Effect<boolean>;
export declare const withPermit: <A, E, R>(self: TxSemaphore, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
export declare const withPermits: <A, E, R>(self: TxSemaphore, n: number, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
export declare const withPermitScoped: (self: TxSemaphore): Effect.Effect<void, never, Scope.Scope>;
```

## Other Exports (Non-Function)

- `TxSemaphore` (interface)
