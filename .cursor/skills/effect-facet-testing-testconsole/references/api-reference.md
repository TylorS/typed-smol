# API Reference: effect/testing/TestConsole

- Import path: `effect/testing/TestConsole`
- Source file: `packages/effect/src/testing/TestConsole.ts`
- Function exports (callable): 1
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `testConsoleWith`

## All Function Signatures

```ts
export declare const testConsoleWith: <A, E, R>(f: (console: TestConsole) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
```

## Other Exports (Non-Function)

- `errorLines` (variable)
- `layer` (variable)
- `logLines` (variable)
- `make` (variable)
- `TestConsole` (interface)
