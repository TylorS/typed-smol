# API Reference: effect/RcRef

- Import path: `effect/RcRef`
- Source file: `packages/effect/src/RcRef.ts`
- Function exports (callable): 3
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `get`
- `invalidate`
- `make`

## All Function Signatures

```ts
export declare const get: <A, E>(self: RcRef<A, E>): Effect.Effect<A, E, Scope>;
export declare const invalidate: <A, E>(self: RcRef<A, E>): Effect.Effect<void>;
export declare const make: <A, E, R>(options: { readonly acquire: Effect.Effect<A, E, R>; readonly idleTimeToLive?: Duration.Input | undefined; }): Effect.Effect<RcRef<A, E>, never, R | Scope>;
```

## Other Exports (Non-Function)

- `RcRef` (interface)
