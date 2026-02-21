# API Reference: effect/Boolean

- Import path: `effect/Boolean`
- Source file: `packages/effect/src/Boolean.ts`
- Function exports (callable): 15
- Non-function exports: 2

## Purpose

This module provides utility functions and type class instances for working with the `boolean` type in TypeScript. It includes functions for basic boolean operations.

## Key Function Exports

- `and`
- `Boolean`
- `Equivalence`
- `eqv`
- `every`
- `implies`
- `isBoolean`
- `match`
- `nand`
- `nor`
- `not`
- `or`
- `Order`
- `some`
- `xor`

## All Function Signatures

```ts
export declare const and: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const and: (self: boolean, that: boolean): boolean; // overload 2
export declare const Boolean: <T>(value?: T): boolean;
export declare const Equivalence: (self: boolean, that: boolean): boolean;
export declare const eqv: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const eqv: (self: boolean, that: boolean): boolean; // overload 2
export declare const every: (collection: Iterable<boolean>): boolean;
export declare const implies: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const implies: (self: boolean, that: boolean): boolean; // overload 2
export declare const isBoolean: (input: unknown): input is boolean;
export declare const match: <A, B = A>(options: { readonly onFalse: LazyArg<A>; readonly onTrue: LazyArg<B>; }): (value: boolean) => A | B; // overload 1
export declare const match: <A, B>(value: boolean, options: { readonly onFalse: LazyArg<A>; readonly onTrue: LazyArg<B>; }): A | B; // overload 2
export declare const nand: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const nand: (self: boolean, that: boolean): boolean; // overload 2
export declare const nor: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const nor: (self: boolean, that: boolean): boolean; // overload 2
export declare const not: (self: boolean): boolean;
export declare const or: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const or: (self: boolean, that: boolean): boolean; // overload 2
export declare const Order: (self: boolean, that: boolean): Ordering;
export declare const some: (collection: Iterable<boolean>): boolean;
export declare const xor: (that: boolean): (self: boolean) => boolean; // overload 1
export declare const xor: (self: boolean, that: boolean): boolean; // overload 2
```

## Other Exports (Non-Function)

- `ReducerAnd` (variable)
- `ReducerOr` (variable)
