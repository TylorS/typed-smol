# API Reference: effect/ScopedRef

- Import path: `effect/ScopedRef`
- Source file: `packages/effect/src/ScopedRef.ts`
- Function exports (callable): 5
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromAcquire`
- `get`
- `getUnsafe`
- `make`
- `set`

## All Function Signatures

```ts
export declare const fromAcquire: <A, E, R>(acquire: Effect.Effect<A, E, R>): Effect.Effect<ScopedRef<A>, E, Scope.Scope | R>;
export declare const get: <A>(self: ScopedRef<A>): Effect.Effect<A>;
export declare const getUnsafe: <A>(self: ScopedRef<A>): A;
export declare const make: <A>(evaluate: LazyArg<A>): Effect.Effect<ScopedRef<A>, never, Scope.Scope>;
export declare const set: <A, R, E>(acquire: Effect.Effect<A, E, R>): (self: ScopedRef<A>) => Effect.Effect<void, E, Exclude<R, Scope.Scope>>; // overload 1
export declare const set: <A, R, E>(self: ScopedRef<A>, acquire: Effect.Effect<A, E, R>): Effect.Effect<void, E, Exclude<R, Scope.Scope>>; // overload 2
```

## Other Exports (Non-Function)

- `ScopedRef` (interface)
