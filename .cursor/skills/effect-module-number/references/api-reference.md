# API Reference: effect/Number

- Import path: `effect/Number`
- Source file: `packages/effect/src/Number.ts`
- Function exports (callable): 25
- Non-function exports: 4

## Purpose

This module provides utility functions and type class instances for working with the `number` type in TypeScript. It includes functions for basic arithmetic operations.

## Key Function Exports

- `between`
- `clamp`
- `decrement`
- `divide`
- `Equivalence`
- `increment`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThan`
- `isLessThanOrEqualTo`
- `isNumber`
- `max`
- `min`
- `multiply`
- `multiplyAll`
- `nextPow2`
- `Number`
- `Order`

## All Function Signatures

```ts
export declare const between: (options: { minimum: number; maximum: number; }): (self: number) => boolean; // overload 1
export declare const between: (self: number, options: { minimum: number; maximum: number; }): boolean; // overload 2
export declare const clamp: (options: { minimum: number; maximum: number; }): (self: number) => number; // overload 1
export declare const clamp: (self: number, options: { minimum: number; maximum: number; }): number; // overload 2
export declare const decrement: (n: number): number;
export declare const divide: (that: number): (self: number) => number | undefined; // overload 1
export declare const divide: (self: number, that: number): number | undefined; // overload 2
export declare const Equivalence: (self: number, that: number): boolean;
export declare const increment: (n: number): number;
export declare const isGreaterThan: (that: number): (self: number) => boolean; // overload 1
export declare const isGreaterThan: (self: number, that: number): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: number): (self: number) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: number, that: number): boolean; // overload 2
export declare const isLessThan: (that: number): (self: number) => boolean; // overload 1
export declare const isLessThan: (self: number, that: number): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: number): (self: number) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: number, that: number): boolean; // overload 2
export declare const isNumber: (input: unknown): input is number;
export declare const max: (that: number): (self: number) => number; // overload 1
export declare const max: (self: number, that: number): number; // overload 2
export declare const min: (that: number): (self: number) => number; // overload 1
export declare const min: (self: number, that: number): number; // overload 2
export declare const multiply: (that: number): (self: number) => number; // overload 1
export declare const multiply: (self: number, that: number): number; // overload 2
export declare const multiplyAll: (collection: Iterable<number>): number;
export declare const nextPow2: (n: number): number;
export declare const Number: (value?: any): number;
export declare const Order: (self: number, that: number): Ordering;
export declare const parse: (s: string): number | undefined;
export declare const remainder: (divisor: number): (self: number) => number; // overload 1
export declare const remainder: (self: number, divisor: number): number; // overload 2
export declare const round: (precision: number): (self: number) => number; // overload 1
export declare const round: (self: number, precision: number): number; // overload 2
export declare const sign: (n: number): Ordering;
export declare const subtract: (that: number): (self: number) => number; // overload 1
export declare const subtract: (self: number, that: number): number; // overload 2
export declare const sum: (that: number): (self: number) => number; // overload 1
export declare const sum: (self: number, that: number): number; // overload 2
export declare const sumAll: (collection: Iterable<number>): number;
```

## Other Exports (Non-Function)

- `ReducerMax` (variable)
- `ReducerMin` (variable)
- `ReducerMultiply` (variable)
- `ReducerSum` (variable)
