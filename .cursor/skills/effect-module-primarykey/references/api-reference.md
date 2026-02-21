# API Reference: effect/PrimaryKey

- Import path: `effect/PrimaryKey`
- Source file: `packages/effect/src/PrimaryKey.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

This module provides functionality for working with primary keys. A `PrimaryKey` is a simple interface that represents a unique identifier that can be converted to a string representation.

## Key Function Exports

- `isPrimaryKey`
- `value`

## All Function Signatures

```ts
export declare const isPrimaryKey: (u: unknown): u is PrimaryKey;
export declare const value: (self: PrimaryKey): string;
```

## Other Exports (Non-Function)

- `PrimaryKey` (interface)
- `symbol` (variable)
