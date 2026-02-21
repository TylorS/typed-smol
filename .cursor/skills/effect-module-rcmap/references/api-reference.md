# API Reference: effect/RcMap

- Import path: `effect/RcMap`
- Source file: `packages/effect/src/RcMap.ts`
- Function exports (callable): 6
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `get`
- `has`
- `invalidate`
- `keys`
- `make`
- `touch`

## All Function Signatures

```ts
export declare const get: <K>(key: K): <A, E>(self: RcMap<K, A, E>) => Effect.Effect<A, E, Scope.Scope>; // overload 1
export declare const get: <K, A, E>(self: RcMap<K, A, E>, key: K): Effect.Effect<A, E, Scope.Scope>; // overload 2
export declare const has: <K>(key: K): <A, E>(self: RcMap<K, A, E>) => Effect.Effect<boolean>; // overload 1
export declare const has: <K, A, E>(self: RcMap<K, A, E>, key: K): Effect.Effect<boolean>; // overload 2
export declare const invalidate: <K>(key: K): <A, E>(self: RcMap<K, A, E>) => Effect.Effect<void>; // overload 1
export declare const invalidate: <K, A, E>(self: RcMap<K, A, E>, key: K): Effect.Effect<void>; // overload 2
export declare const keys: <K, A, E>(self: RcMap<K, A, E>): Effect.Effect<Iterable<K>>;
export declare const make: <K, A, E, R>(options: { readonly lookup: (key: K) => Effect.Effect<A, E, R>; readonly idleTimeToLive?: Duration.Input | ((key: K) => Duration.Input) | undefined; readonly capacity?: undefined; }): Effect.Effect<RcMap<K, A, E>, never, Scope.Scope | R>; // overload 1
export declare const make: <K, A, E, R>(options: { readonly lookup: (key: K) => Effect.Effect<A, E, R>; readonly idleTimeToLive?: Duration.Input | ((key: K) => Duration.Input) | undefined; readonly capacity: number; }): Effect.Effect<RcMap<K, A, E | Cause.ExceededCapacityError>, never, Scope.Scope | R>; // overload 2
export declare const touch: <K>(key: K): <A, E>(self: RcMap<K, A, E>) => Effect.Effect<void>; // overload 1
export declare const touch: <K, A, E>(self: RcMap<K, A, E>, key: K): Effect.Effect<void>; // overload 2
```

## Other Exports (Non-Function)

- `RcMap` (interface)
- `State` (type)
