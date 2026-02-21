# API Reference: effect/Terminal

- Import path: `effect/Terminal`
- Source file: `packages/effect/src/Terminal.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isQuitError`
- `make`

## All Function Signatures

```ts
export declare const isQuitError: (u: unknown): u is QuitError;
export declare const make: (impl: Omit<Terminal, typeof TypeId>): Terminal;
```

## Other Exports (Non-Function)

- `Key` (interface)
- `QuitError` (class)
- `Terminal` (interface)
- `UserInput` (interface)
