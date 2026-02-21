# API Reference: effect/ScopedCache

- Import path: `effect/ScopedCache`
- Source file: `packages/effect/src/ScopedCache.ts`
- Function exports (callable): 15
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `entries`
- `get`
- `getOption`
- `getSuccess`
- `has`
- `invalidate`
- `invalidateAll`
- `invalidateWhen`
- `keys`
- `make`
- `makeWith`
- `refresh`
- `set`
- `size`
- `values`

## All Function Signatures

```ts
export declare const entries: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>): Effect.Effect<Array<[Key, A]>>;
export declare const get: <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const get: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<A, E, R>; // overload 2
export declare const getOption: <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Option.Option<A>, E>; // overload 1
export declare const getOption: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<Option.Option<A>, E>; // overload 2
export declare const getSuccess: <Key, A, R>(key: Key): <E>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Option.Option<A>>; // overload 1
export declare const getSuccess: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<Option.Option<A>>; // overload 2
export declare const has: <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<boolean>; // overload 1
export declare const has: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<boolean>; // overload 2
export declare const invalidate: <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<void>; // overload 1
export declare const invalidate: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<void>; // overload 2
export declare const invalidateAll: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>): Effect.Effect<void>;
export declare const invalidateWhen: <Key, A>(key: Key, f: Predicate.Predicate<A>): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<boolean>; // overload 1
export declare const invalidateWhen: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key, f: Predicate.Predicate<A>): Effect.Effect<boolean>; // overload 2
export declare const keys: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>): Effect.Effect<Array<Key>>;
export declare const make: <Key, A, E = never, R = never, ServiceMode extends "lookup" | "construction" = never>(options: { readonly lookup: (key: Key) => Effect.Effect<A, E, R | Scope.Scope>; readonly capacity: number; readonly timeToLive?: Duration.Input | undefined; readonly requireServicesAt?: ServiceMode | undefined; }): Effect.Effect<ScopedCache<Key, A, E, "lookup" extends ServiceMode ? Exclude<R, Scope.Scope> : never>, never, ("lookup" extends ServiceMode ? never : R) | Scope.Scope>;
export declare const makeWith: <Key, A, E = never, R = never, ServiceMode extends "lookup" | "construction" = never>(options: { readonly lookup: (key: Key) => Effect.Effect<A, E, R | Scope.Scope>; readonly capacity: number; readonly timeToLive?: ((exit: Exit.Exit<A, E>, key: Key) => Duration.Input) | undefined; readonly requireServicesAt?: ServiceMode | undefined; }): Effect.Effect<ScopedCache<Key, A, E, "lookup" extends ServiceMode ? Exclude<R, Scope.Scope> : never>, never, ("lookup" extends ServiceMode ? never : R) | Scope.Scope>;
export declare const refresh: <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const refresh: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<A, E, R>; // overload 2
export declare const set: <Key, A>(key: Key, value: A): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<void>; // overload 1
export declare const set: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key, value: A): Effect.Effect<void>; // overload 2
export declare const size: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>): Effect.Effect<number>;
export declare const values: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>): Effect.Effect<Array<A>>;
```

## Other Exports (Non-Function)

- `Entry` (interface)
- `ScopedCache` (interface)
- `State` (type)
