# API Reference: effect/Formatter

- Import path: `effect/Formatter`
- Source file: `packages/effect/src/Formatter.ts`
- Function exports (callable): 5
- Non-function exports: 1

## Purpose

Utilities for converting arbitrary JavaScript values into human-readable strings, with support for circular references, redaction, and common JS types that `JSON.stringify` handles poorly.

## Key Function Exports

- `format`
- `formatDate`
- `formatJson`
- `formatPath`
- `formatPropertyKey`

## All Function Signatures

```ts
export declare const format: (input: unknown, options?: { readonly space?: number | string | undefined; readonly ignoreToString?: boolean | undefined; }): string;
export declare const formatDate: (date: Date): string;
export declare const formatJson: (input: unknown, options?: { readonly space?: number | string | undefined; }): string;
export declare const formatPath: (path: ReadonlyArray<PropertyKey>): string;
export declare const formatPropertyKey: (name: PropertyKey): string;
```

## Other Exports (Non-Function)

- `Formatter` (interface)
