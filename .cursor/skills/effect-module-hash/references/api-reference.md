# API Reference: effect/Hash

- Import path: `effect/Hash`
- Source file: `packages/effect/src/Hash.ts`
- Function exports (callable): 10
- Non-function exports: 2

## Purpose

This module provides utilities for hashing values in TypeScript.

## Key Function Exports

- `array`
- `combine`
- `hash`
- `isHash`
- `number`
- `optimize`
- `random`
- `string`
- `structure`
- `structureKeys`

## All Function Signatures

```ts
export declare const array: <A>(arr: Iterable<A>): number;
export declare const combine: (b: number): (self: number) => number; // overload 1
export declare const combine: (self: number, b: number): number; // overload 2
export declare const hash: <A>(self: A): number;
export declare const isHash: (u: unknown): u is Hash;
export declare const number: (n: number): number;
export declare const optimize: (n: number): number;
export declare const random: <A extends object>(self: A): number;
export declare const string: (str: string): number;
export declare const structure: <A extends object>(o: A): number;
export declare const structureKeys: (o: object, keys: Iterable<PropertyKey>): number;
```

## Other Exports (Non-Function)

- `Hash` (interface)
- `symbol` (variable)
