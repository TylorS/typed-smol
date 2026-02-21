# API Reference: effect/Fiber#lifecycle

- Import path: `effect/Fiber#lifecycle`
- Source file: `packages/effect/src/Fiber.ts`
- Thematic facet: `lifecycle`
- Function exports (callable): 8
- Non-function exports: 1

## Purpose

This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## Key Function Exports

- `await`
- `awaitAll`
- `interrupt`
- `interruptAll`
- `interruptAllAs`
- `interruptAs`
- `join`
- `joinAll`

## All Function Signatures

```ts
export declare const await: <A, E>(self: Fiber<A, E>): Effect<Exit<A, E>>;
export declare const awaitAll: <A extends Fiber<any, any>>(self: Iterable<A>): Effect<Array<Exit<A extends Fiber<infer _A, infer _E> ? _A : never, A extends Fiber<infer _A, infer _E> ? _E : never>>>;
export declare const interrupt: <A, E>(self: Fiber<A, E>): Effect<void>;
export declare const interruptAll: <A extends Iterable<Fiber<any, any>>>(fibers: A): Effect<void>;
export declare const interruptAllAs: (fiberId: number): <A extends Iterable<Fiber<any, any>>>(fibers: A) => Effect<void>; // overload 1
export declare const interruptAllAs: <A extends Iterable<Fiber<any, any>>>(fibers: A, fiberId: number): Effect<void>; // overload 2
export declare const interruptAs: (fiberId: number): <A, E>(self: Fiber<A, E>) => Effect<void>; // overload 1
export declare const interruptAs: <A, E>(self: Fiber<A, E>, fiberId: number): Effect<void>; // overload 2
export declare const join: <A, E>(self: Fiber<A, E>): Effect<A, E>;
export declare const joinAll: <A extends Iterable<Fiber<any, any>>>(self: A): Effect<Arr.ReadonlyArray.With<A, A extends Iterable<Fiber<infer _A, infer _E>> ? _A : never>, A extends Fiber<infer _A, infer _E> ? _E : never>;
```

## Other Exports (Non-Function)

- `Fiber` (interface)
