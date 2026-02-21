# API Reference: effect/Equal

- Import path: `effect/Equal`
- Source file: `packages/effect/src/Equal.ts`
- Function exports (callable): 7
- Non-function exports: 2

## Purpose

This module provides functionality for defining and working with equality between values. It includes the `Equal` interface for types that can determine equality with other values of the same type, and utilities for comparing values.

## Key Function Exports

- `asEquivalence`
- `byReference`
- `byReferenceUnsafe`
- `equals`
- `isEqual`
- `makeCompareMap`
- `makeCompareSet`

## All Function Signatures

```ts
export declare const asEquivalence: <A>(): Equivalence<A>;
export declare const byReference: <T extends object>(obj: T): T;
export declare const byReferenceUnsafe: <T extends object>(obj: T): T;
export declare const equals: <B>(that: B): <A>(self: A) => boolean; // overload 1
export declare const equals: <A, B>(self: A, that: B): boolean; // overload 2
export declare const isEqual: (u: unknown): u is Equal;
export declare const makeCompareMap: <K, V>(keyEquivalence: Equivalence<K>, valueEquivalence: Equivalence<V>): (self: Iterable<[K, V]>, that: Iterable<[K, V]>) => boolean;
export declare const makeCompareSet: <A>(equivalence: Equivalence<A>): (self: Iterable<A>, that: Iterable<A>) => boolean;
```

## Other Exports (Non-Function)

- `Equal` (interface)
- `symbol` (variable)
