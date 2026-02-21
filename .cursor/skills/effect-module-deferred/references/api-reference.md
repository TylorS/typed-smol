# API Reference: effect/Deferred

- Import path: `effect/Deferred`
- Source file: `packages/effect/src/Deferred.ts`
- Function exports (callable): 21
- Non-function exports: 1

## Purpose

This module provides utilities for working with `Deferred`, a powerful concurrency primitive that represents an asynchronous variable that can be set exactly once. Multiple fibers can await the same `Deferred` and will all be notified when it completes.

## Key Function Exports

- `await`
- `complete`
- `completeWith`
- `die`
- `dieSync`
- `done`
- `doneUnsafe`
- `fail`
- `failCause`
- `failCauseSync`
- `failSync`
- `interrupt`
- `interruptWith`
- `into`
- `isDone`
- `isDoneUnsafe`
- `make`
- `makeUnsafe`

## All Function Signatures

```ts
export declare const await: <A, E>(self: Deferred<A, E>): Effect<A, E>;
export declare const complete: <A, E, R>(effect: Effect<A, E, R>): (self: Deferred<A, E>) => Effect<boolean, never, R>; // overload 1
export declare const complete: <A, E, R>(self: Deferred<A, E>, effect: Effect<A, E, R>): Effect<boolean, never, R>; // overload 2
export declare const completeWith: <A, E>(effect: Effect<A, E>): (self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const completeWith: <A, E>(self: Deferred<A, E>, effect: Effect<A, E>): Effect<boolean>; // overload 2
export declare const die: (defect: unknown): <A, E>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const die: <A, E>(self: Deferred<A, E>, defect: unknown): Effect<boolean>; // overload 2
export declare const dieSync: (evaluate: LazyArg<unknown>): <A, E>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const dieSync: <A, E>(self: Deferred<A, E>, evaluate: LazyArg<unknown>): Effect<boolean>; // overload 2
export declare const done: <A, E>(exit: Exit.Exit<A, E>): (self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const done: <A, E>(self: Deferred<A, E>, exit: Exit.Exit<A, E>): Effect<boolean>; // overload 2
export declare const doneUnsafe: <A, E>(self: Deferred<A, E>, effect: Effect<A, E>): boolean;
export declare const fail: <E>(error: E): <A>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const fail: <A, E>(self: Deferred<A, E>, error: E): Effect<boolean>; // overload 2
export declare const failCause: <E>(cause: Cause.Cause<E>): <A>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const failCause: <A, E>(self: Deferred<A, E>, cause: Cause.Cause<E>): Effect<boolean>; // overload 2
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): <A>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const failCauseSync: <A, E>(self: Deferred<A, E>, evaluate: LazyArg<Cause.Cause<E>>): Effect<boolean>; // overload 2
export declare const failSync: <E>(evaluate: LazyArg<E>): <A>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const failSync: <A, E>(self: Deferred<A, E>, evaluate: LazyArg<E>): Effect<boolean>; // overload 2
export declare const interrupt: <A, E>(self: Deferred<A, E>): Effect<boolean>;
export declare const interruptWith: (fiberId: number): <A, E>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const interruptWith: <A, E>(self: Deferred<A, E>, fiberId: number): Effect<boolean>; // overload 2
export declare const into: <A, E>(deferred: Deferred<A, E>): <R>(self: Effect<A, E, R>) => Effect<boolean, never, R>; // overload 1
export declare const into: <A, E, R>(self: Effect<A, E, R>, deferred: Deferred<A, E>): Effect<boolean, never, R>; // overload 2
export declare const isDone: <A, E>(self: Deferred<A, E>): Effect<boolean>;
export declare const isDoneUnsafe: <A, E>(self: Deferred<A, E>): boolean;
export declare const make: <A, E = never>(): Effect<Deferred<A, E>>;
export declare const makeUnsafe: <A, E = never>(): Deferred<A, E>;
export declare const poll: <A, E>(self: Deferred<A, E>): Effect<Effect<A, E> | undefined>;
export declare const succeed: <A>(value: A): <E>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const succeed: <A, E>(self: Deferred<A, E>, value: A): Effect<boolean>; // overload 2
export declare const sync: <A>(evaluate: LazyArg<A>): <E>(self: Deferred<A, E>) => Effect<boolean>; // overload 1
export declare const sync: <A, E>(self: Deferred<A, E>, evaluate: LazyArg<A>): Effect<boolean>; // overload 2
```

## Other Exports (Non-Function)

- `Deferred` (interface)
