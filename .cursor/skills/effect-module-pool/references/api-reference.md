# API Reference: effect/Pool

- Import path: `effect/Pool`
- Source file: `packages/effect/src/Pool.ts`
- Function exports (callable): 6
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `get`
- `invalidate`
- `isPool`
- `make`
- `makeWithStrategy`
- `makeWithTTL`

## All Function Signatures

```ts
export declare const get: <A, E>(self: Pool<A, E>): Effect.Effect<A, E, Scope.Scope>;
export declare const invalidate: <A>(item: A): <E>(self: Pool<A, E>) => Effect.Effect<void, never, Scope.Scope>; // overload 1
export declare const invalidate: <A, E>(self: Pool<A, E>, item: A): Effect.Effect<void, never, Scope.Scope>; // overload 2
export declare const isPool: (u: unknown): u is Pool<unknown, unknown>;
export declare const make: <A, E, R>(options: { readonly acquire: Effect.Effect<A, E, R>; readonly size: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; }): Effect.Effect<Pool<A, E>, never, R | Scope.Scope>;
export declare const makeWithStrategy: <A, E, R>(options: { readonly acquire: Effect.Effect<A, E, R>; readonly min: number; readonly max: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; readonly strategy: Strategy<A, E>; }): Effect.Effect<Pool<A, E>, never, Scope.Scope | R>;
export declare const makeWithTTL: <A, E, R>(options: { readonly acquire: Effect.Effect<A, E, R>; readonly min: number; readonly max: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; readonly timeToLive: Duration.Input; readonly timeToLiveStrategy?: "creation" | "usage" | undefined; }): Effect.Effect<Pool<A, E>, never, R | Scope.Scope>;
```

## Other Exports (Non-Function)

- `Config` (interface)
- `Pool` (interface)
- `PoolItem` (interface)
- `State` (interface)
- `Strategy` (interface)
