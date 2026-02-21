# API Reference: effect/Scope#creation

- Import path: `effect/Scope#creation`
- Source file: `packages/effect/src/Scope.ts`
- Thematic facet: `creation`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## Key Function Exports

- `make`
- `makeUnsafe`

## All Function Signatures

```ts
export declare const make: (finalizerStrategy?: "sequential" | "parallel"): Effect<Closeable>;
export declare const makeUnsafe: (finalizerStrategy?: "sequential" | "parallel"): Closeable;
```

## Other Exports (Non-Function)

- `Closeable` (interface)
- `Scope` (interface)
- `State` (namespace)
