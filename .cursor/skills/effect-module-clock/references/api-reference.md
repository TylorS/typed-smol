# API Reference: effect/Clock

- Import path: `effect/Clock`
- Source file: `packages/effect/src/Clock.ts`
- Function exports (callable): 1
- Non-function exports: 3

## Purpose

The `Clock` module provides functionality for time-based operations in Effect applications. It offers precise time measurements, scheduling capabilities, and controlled time management for testing scenarios.

## Key Function Exports

- `clockWith`

## All Function Signatures

```ts
export declare const clockWith: <A, E, R>(f: (clock: Clock) => Effect<A, E, R>): Effect<A, E, R>;
```

## Other Exports (Non-Function)

- `Clock` (interface)
- `currentTimeMillis` (variable)
- `currentTimeNanos` (variable)
