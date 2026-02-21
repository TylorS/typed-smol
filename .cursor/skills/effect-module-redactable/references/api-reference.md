# API Reference: effect/Redactable

- Import path: `effect/Redactable`
- Source file: `packages/effect/src/Redactable.ts`
- Function exports (callable): 3
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `getRedacted`
- `isRedactable`
- `redact`

## All Function Signatures

```ts
export declare const getRedacted: (redactable: Redactable): unknown;
export declare const isRedactable: (u: unknown): u is Redactable;
export declare const redact: (u: unknown): unknown;
```

## Other Exports (Non-Function)

- `currentFiberTypeId` (variable)
- `Redactable` (interface)
- `symbolRedactable` (variable)
