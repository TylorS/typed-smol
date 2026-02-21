# API Reference: effect/FiberMap

- Import path: `effect/FiberMap`
- Source file: `packages/effect/src/FiberMap.ts`
- Function exports (callable): 18
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `awaitEmpty`
- `clear`
- `get`
- `getUnsafe`
- `has`
- `hasUnsafe`
- `isFiberMap`
- `join`
- `make`
- `makeRuntime`
- `makeRuntimePromise`
- `remove`
- `run`
- `runtime`
- `runtimePromise`
- `set`
- `setUnsafe`
- `size`

## All Function Signatures

```ts
export declare const awaitEmpty: <K, A, E>(self: FiberMap<K, A, E>): Effect.Effect<void, E>;
export declare const clear: <K, A, E>(self: FiberMap<K, A, E>): Effect.Effect<void>;
export declare const get: <K>(key: K): <A, E>(self: FiberMap<K, A, E>) => Effect.Effect<Fiber.Fiber<A, E> | undefined>; // overload 1
export declare const get: <K, A, E>(self: FiberMap<K, A, E>, key: K): Effect.Effect<Fiber.Fiber<A, E> | undefined>; // overload 2
export declare const getUnsafe: <K>(key: K): <A, E>(self: FiberMap<K, A, E>) => Fiber.Fiber<A, E> | undefined; // overload 1
export declare const getUnsafe: <K, A, E>(self: FiberMap<K, A, E>, key: K): Fiber.Fiber<A, E> | undefined; // overload 2
export declare const has: <K>(key: K): <A, E>(self: FiberMap<K, A, E>) => Effect.Effect<boolean>; // overload 1
export declare const has: <K, A, E>(self: FiberMap<K, A, E>, key: K): Effect.Effect<boolean>; // overload 2
export declare const hasUnsafe: <K>(key: K): <A, E>(self: FiberMap<K, A, E>) => boolean; // overload 1
export declare const hasUnsafe: <K, A, E>(self: FiberMap<K, A, E>, key: K): boolean; // overload 2
export declare const isFiberMap: (u: unknown): u is FiberMap<unknown>;
export declare const join: <K, A, E>(self: FiberMap<K, A, E>): Effect.Effect<void, E>;
export declare const make: <K, A = unknown, E = unknown>(): Effect.Effect<FiberMap<K, A, E>, never, Scope.Scope>;
export declare const makeRuntime: <R, K, E = unknown, A = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(key: K, effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly onlyIfMissing?: boolean | undefined; }) | undefined) => Fiber.Fiber<XA, XE>), never, Scope.Scope | R>;
export declare const makeRuntimePromise: <R, K, A = unknown, E = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(key: K, effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly onlyIfMissing?: boolean | undefined; }) | undefined) => Promise<XA>), never, Scope.Scope | R>;
export declare const remove: <K>(key: K): <A, E>(self: FiberMap<K, A, E>) => Effect.Effect<void>; // overload 1
export declare const remove: <K, A, E>(self: FiberMap<K, A, E>, key: K): Effect.Effect<void>; // overload 2
export declare const run: <K, A, E>(self: FiberMap<K, A, E>, key: K, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; } | undefined): <R, XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>) => Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 1
export declare const run: <K, A, E, R, XE extends E, XA extends A>(self: FiberMap<K, A, E>, key: K, effect: Effect.Effect<XA, XE, R>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; } | undefined): Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 2
export declare const runtime: <K, A, E>(self: FiberMap<K, A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(key: K, effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; }) | undefined) => Fiber.Fiber<XA, XE>), never, R>;
export declare const runtimePromise: <K, A, E>(self: FiberMap<K, A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(key: K, effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; }) | undefined) => Promise<XA>), never, R>;
export declare const set: <K, A, E, XE extends E, XA extends A>(key: K, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined): (self: FiberMap<K, A, E>) => Effect.Effect<void>; // overload 1
export declare const set: <K, A, E, XE extends E, XA extends A>(self: FiberMap<K, A, E>, key: K, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined): Effect.Effect<void>; // overload 2
export declare const setUnsafe: <K, A, E, XE extends E, XA extends A>(key: K, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined): (self: FiberMap<K, A, E>) => void; // overload 1
export declare const setUnsafe: <K, A, E, XE extends E, XA extends A>(self: FiberMap<K, A, E>, key: K, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined): void; // overload 2
export declare const size: <K, A, E>(self: FiberMap<K, A, E>): Effect.Effect<number>;
```

## Other Exports (Non-Function)

- `FiberMap` (interface)
