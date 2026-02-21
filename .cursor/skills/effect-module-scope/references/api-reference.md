# API Reference: effect/Scope

- Import path: `effect/Scope`
- Source file: `packages/effect/src/Scope.ts`
- Function exports (callable): 10
- Non-function exports: 3

## Purpose

The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## Key Function Exports

- `addFinalizer`
- `addFinalizerExit`
- `close`
- `closeUnsafe`
- `fork`
- `forkUnsafe`
- `make`
- `makeUnsafe`
- `provide`
- `use`

## All Function Signatures

```ts
export declare const addFinalizer: (scope: Scope, finalizer: Effect<unknown>): Effect<void>;
export declare const addFinalizerExit: (scope: Scope, finalizer: (exit: Exit<any, any>) => Effect<unknown>): Effect<void>;
export declare const close: <A, E>(self: Scope, exit: Exit<A, E>): Effect<void>;
export declare const closeUnsafe: <A, E>(self: Scope, exit_: Exit<A, E>): Effect<void, never, never> | undefined;
export declare const fork: (scope: Scope, finalizerStrategy?: "sequential" | "parallel"): Effect<Closeable>;
export declare const forkUnsafe: (scope: Scope, finalizerStrategy?: "sequential" | "parallel"): Closeable;
export declare const make: (finalizerStrategy?: "sequential" | "parallel"): Effect<Closeable>;
export declare const makeUnsafe: (finalizerStrategy?: "sequential" | "parallel"): Closeable;
export declare const provide: (value: Scope): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, Scope>>; // overload 1
export declare const provide: <A, E, R>(self: Effect<A, E, R>, value: Scope): Effect<A, E, Exclude<R, Scope>>; // overload 2
export declare const use: (scope: Closeable): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, Scope>>; // overload 1
export declare const use: <A, E, R>(self: Effect<A, E, R>, scope: Closeable): Effect<A, E, Exclude<R, Scope>>; // overload 2
```

## Other Exports (Non-Function)

- `Closeable` (interface)
- `Scope` (interface)
- `State` (namespace)
