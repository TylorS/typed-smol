# API Reference: effect/FiberHandle

- Import path: `effect/FiberHandle`
- Source file: `packages/effect/src/FiberHandle.ts`
- Function exports (callable): 14
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `awaitEmpty`
- `clear`
- `get`
- `getUnsafe`
- `isFiberHandle`
- `join`
- `make`
- `makeRuntime`
- `makeRuntimePromise`
- `run`
- `runtime`
- `runtimePromise`
- `set`
- `setUnsafe`

## All Function Signatures

```ts
export declare const awaitEmpty: <A, E>(self: FiberHandle<A, E>): Effect.Effect<void, E>;
export declare const clear: <A, E>(self: FiberHandle<A, E>): Effect.Effect<void>;
export declare const get: <A, E>(self: FiberHandle<A, E>): Effect.Effect<Fiber.Fiber<A, E> | undefined>;
export declare const getUnsafe: <A, E>(self: FiberHandle<A, E>): Fiber.Fiber<A, E> | undefined;
export declare const isFiberHandle: (u: unknown): u is FiberHandle;
export declare const join: <A, E>(self: FiberHandle<A, E>): Effect.Effect<void, E>;
export declare const make: <A = unknown, E = unknown>(): Effect.Effect<FiberHandle<A, E>, never, Scope.Scope>;
export declare const makeRuntime: <R, E = unknown, A = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: { readonly signal?: AbortSignal | undefined; readonly scheduler?: Scheduler | undefined; readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined) => Fiber.Fiber<XA, XE>), never, Scope.Scope | R>;
export declare const makeRuntimePromise: <R = never, A = unknown, E = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: { readonly signal?: AbortSignal | undefined; readonly scheduler?: Scheduler | undefined; readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined) => Promise<XA>), never, Scope.Scope | R>;
export declare const run: <A, E>(self: FiberHandle<A, E>, options?: { readonly onlyIfMissing?: boolean; readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; }): <R, XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>) => Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 1
export declare const run: <A, E, R, XE extends E, XA extends A>(self: FiberHandle<A, E>, effect: Effect.Effect<XA, XE, R>, options?: { readonly onlyIfMissing?: boolean; readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; }): Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 2
export declare const runtime: <A, E>(self: FiberHandle<A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: { readonly signal?: AbortSignal | undefined; readonly scheduler?: Scheduler | undefined; readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined) => Fiber.Fiber<XA, XE>), never, R>;
export declare const runtimePromise: <A, E>(self: FiberHandle<A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: { readonly signal?: AbortSignal | undefined; readonly scheduler?: Scheduler | undefined; readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; } | undefined) => Promise<XA>), never, R>;
export declare const set: <A, E, XE extends E, XA extends A>(fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean; readonly propagateInterruption?: boolean | undefined; }): (self: FiberHandle<A, E>) => Effect.Effect<void>; // overload 1
export declare const set: <A, E, XE extends E, XA extends A>(self: FiberHandle<A, E>, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean; readonly propagateInterruption?: boolean | undefined; }): Effect.Effect<void>; // overload 2
export declare const setUnsafe: <A, E, XE extends E, XA extends A>(fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; }): (self: FiberHandle<A, E>) => void; // overload 1
export declare const setUnsafe: <A, E, XE extends E, XA extends A>(self: FiberHandle<A, E>, fiber: Fiber.Fiber<XA, XE>, options?: { readonly onlyIfMissing?: boolean | undefined; readonly propagateInterruption?: boolean | undefined; }): void; // overload 2
```

## Other Exports (Non-Function)

- `FiberHandle` (interface)
