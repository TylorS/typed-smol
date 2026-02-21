# API Reference: effect/FiberSet

- Import path: `effect/FiberSet`
- Source file: `packages/effect/src/FiberSet.ts`
- Function exports (callable): 13
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `addUnsafe`
- `awaitEmpty`
- `clear`
- `isFiberSet`
- `join`
- `make`
- `makeRuntime`
- `makeRuntimePromise`
- `run`
- `runtime`
- `runtimePromise`
- `size`

## All Function Signatures

```ts
export declare const add: <A, E, XE extends E, XA extends A>(fiber: Fiber.Fiber<XA, XE>, options?: { readonly propagateInterruption?: boolean | undefined; } | undefined): (self: FiberSet<A, E>) => Effect.Effect<void>; // overload 1
export declare const add: <A, E, XE extends E, XA extends A>(self: FiberSet<A, E>, fiber: Fiber.Fiber<XA, XE>, options?: { readonly propagateInterruption?: boolean | undefined; } | undefined): Effect.Effect<void>; // overload 2
export declare const addUnsafe: <A, E, XE extends E, XA extends A>(fiber: Fiber.Fiber<XA, XE>, options?: { readonly propagateInterruption?: boolean | undefined; } | undefined): (self: FiberSet<A, E>) => void; // overload 1
export declare const addUnsafe: <A, E, XE extends E, XA extends A>(self: FiberSet<A, E>, fiber: Fiber.Fiber<XA, XE>, options?: { readonly propagateInterruption?: boolean | undefined; } | undefined): void; // overload 2
export declare const awaitEmpty: <A, E>(self: FiberSet<A, E>): Effect.Effect<void>;
export declare const clear: <A, E>(self: FiberSet<A, E>): Effect.Effect<void>;
export declare const isFiberSet: (u: unknown): u is FiberSet<unknown, unknown>;
export declare const join: <A, E>(self: FiberSet<A, E>): Effect.Effect<void, E>;
export declare const make: <A = unknown, E = unknown>(): Effect.Effect<FiberSet<A, E>, never, Scope.Scope>;
export declare const makeRuntime: <R = never, A = unknown, E = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly propagateInterruption?: boolean | undefined; }) | undefined) => Fiber.Fiber<XA, XE>), never, Scope.Scope | R>;
export declare const makeRuntimePromise: <R = never, A = unknown, E = unknown>(): Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly propagateInterruption?: boolean | undefined; }) | undefined) => Promise<XA>), never, R | Scope.Scope>;
export declare const run: <A, E>(self: FiberSet<A, E>, options?: { readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; } | undefined): <R, XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>) => Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 1
export declare const run: <A, E, R, XE extends E, XA extends A>(self: FiberSet<A, E>, effect: Effect.Effect<XA, XE, R>, options?: { readonly propagateInterruption?: boolean | undefined; readonly startImmediately?: boolean | undefined; } | undefined): Effect.Effect<Fiber.Fiber<XA, XE>, never, R>; // overload 2
export declare const runtime: <A, E>(self: FiberSet<A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly propagateInterruption?: boolean | undefined; }) | undefined) => Fiber.Fiber<XA, XE>), never, R>;
export declare const runtimePromise: <A, E>(self: FiberSet<A, E>): <R = never>() => Effect.Effect<(<XE extends E, XA extends A>(effect: Effect.Effect<XA, XE, R>, options?: (Effect.RunOptions & { readonly propagateInterruption?: boolean | undefined; }) | undefined) => Promise<XA>), never, R>;
export declare const size: <A, E>(self: FiberSet<A, E>): Effect.Effect<number>;
```

## Other Exports (Non-Function)

- `FiberSet` (interface)
