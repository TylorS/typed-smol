# API Reference: effect/Scope#finalization

- Import path: `effect/Scope#finalization`
- Source file: `packages/effect/src/Scope.ts`
- Thematic facet: `finalization`
- Function exports (callable): 4
- Non-function exports: 1

## Purpose

The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## Key Function Exports

- `addFinalizer`
- `addFinalizerExit`
- `close`
- `closeUnsafe`

## All Function Signatures

```ts
export declare const addFinalizer: (scope: Scope, finalizer: Effect<unknown>): Effect<void>;
export declare const addFinalizerExit: (scope: Scope, finalizer: (exit: Exit<any, any>) => Effect<unknown>): Effect<void>;
export declare const close: <A, E>(self: Scope, exit: Exit<A, E>): Effect<void>;
export declare const closeUnsafe: <A, E>(self: Scope, exit_: Exit<A, E>): Effect<void, never, never> | undefined;
```

## Other Exports (Non-Function)

- `Closeable` (interface)
