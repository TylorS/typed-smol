# API Reference: effect/Inspectable

- Import path: `effect/Inspectable`
- Source file: `packages/effect/src/Inspectable.ts`
- Function exports (callable): 3
- Non-function exports: 4

## Purpose

This module provides utilities for making values inspectable and debuggable in TypeScript.

## Key Function Exports

- `stringifyCircular`
- `toJson`
- `toStringUnknown`

## All Function Signatures

```ts
export declare const stringifyCircular: (obj: unknown, whitespace?: number | string | undefined): string;
export declare const toJson: (input: unknown): unknown;
export declare const toStringUnknown: (u: unknown, whitespace?: number | string | undefined): string;
```

## Other Exports (Non-Function)

- `BaseProto` (variable)
- `Class` (class)
- `Inspectable` (interface)
- `NodeInspectSymbol` (type)
