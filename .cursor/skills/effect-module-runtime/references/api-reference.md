# API Reference: effect/Runtime

- Import path: `effect/Runtime`
- Source file: `packages/effect/src/Runtime.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

This module provides utilities for running Effect programs and managing their execution lifecycle.

## Key Function Exports

- `defaultTeardown`
- `makeRunMain`

## All Function Signatures

```ts
export declare const defaultTeardown: <E, A>(exit: Exit.Exit<E, A>, onExit: (code: number) => void): void;
export declare const makeRunMain: (f: <E, A>(options: { readonly fiber: Fiber.Fiber<A, E>; readonly teardown: Teardown; }) => void): { (options?: { readonly disableErrorReporting?: boolean | undefined; readonly teardown?: Teardown | undefined; }): <E, A>(effect: Effect.Effect<A, E>) => void; <E, A>(effect: Effect.Effect<A, E>, options?: { readonly disableErrorReporting?: boolean | undefined; readonly teardown?: Teardown | undefined; }): void; };
```

## Other Exports (Non-Function)

- `Teardown` (interface)
