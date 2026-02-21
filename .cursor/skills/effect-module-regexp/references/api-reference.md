# API Reference: effect/RegExp

- Import path: `effect/RegExp`
- Source file: `packages/effect/src/RegExp.ts`
- Function exports (callable): 3
- Non-function exports: 0

## Purpose

This module provides utility functions for working with RegExp in TypeScript.

## Key Function Exports

- `escape`
- `isRegExp`
- `RegExp`

## All Function Signatures

```ts
export declare const escape: (string: string): string;
export declare const isRegExp: (input: unknown): input is RegExp;
export declare const RegExp: (pattern: RegExp | string): RegExp; // overload 1
export declare const RegExp: (pattern: string, flags?: string): RegExp; // overload 2
export declare const RegExp: (pattern: RegExp | string, flags?: string): RegExp; // overload 3
```

## Other Exports (Non-Function)

- None
