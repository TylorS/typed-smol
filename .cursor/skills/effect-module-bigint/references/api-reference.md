# API Reference: effect/BigInt

- Import path: `effect/BigInt`
- Source file: `packages/effect/src/BigInt.ts`
- Function exports (callable): 31
- Non-function exports: 4

## Purpose

This module provides utility functions and type class instances for working with the `bigint` type in TypeScript. It includes functions for basic arithmetic operations.

## Key Function Exports

- `abs`
- `between`
- `BigInt`
- `clamp`
- `decrement`
- `divide`
- `divideUnsafe`
- `Equivalence`
- `fromNumber`
- `fromString`
- `gcd`
- `increment`
- `isBigInt`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThan`
- `isLessThanOrEqualTo`
- `lcm`

## All Function Signatures

```ts
export declare const abs: (n: bigint): bigint;
export declare const between: (options: { minimum: bigint; maximum: bigint; }): (self: bigint) => boolean; // overload 1
export declare const between: (self: bigint, options: { minimum: bigint; maximum: bigint; }): boolean; // overload 2
export declare const BigInt: (value: bigint | boolean | number | string): bigint;
export declare const clamp: (options: { minimum: bigint; maximum: bigint; }): (self: bigint) => bigint; // overload 1
export declare const clamp: (self: bigint, options: { minimum: bigint; maximum: bigint; }): bigint; // overload 2
export declare const decrement: (n: bigint): bigint;
export declare const divide: (that: bigint): (self: bigint) => bigint | undefined; // overload 1
export declare const divide: (self: bigint, that: bigint): bigint | undefined; // overload 2
export declare const divideUnsafe: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const divideUnsafe: (self: bigint, that: bigint): bigint; // overload 2
export declare const Equivalence: (self: bigint, that: bigint): boolean;
export declare const fromNumber: (n: number): bigint | undefined;
export declare const fromString: (s: string): bigint | undefined;
export declare const gcd: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const gcd: (self: bigint, that: bigint): bigint; // overload 2
export declare const increment: (n: bigint): bigint;
export declare const isBigInt: (u: unknown): u is bigint;
export declare const isGreaterThan: (that: bigint): (self: bigint) => boolean; // overload 1
export declare const isGreaterThan: (self: bigint, that: bigint): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: bigint): (self: bigint) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: bigint, that: bigint): boolean; // overload 2
export declare const isLessThan: (that: bigint): (self: bigint) => boolean; // overload 1
export declare const isLessThan: (self: bigint, that: bigint): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: bigint): (self: bigint) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: bigint, that: bigint): boolean; // overload 2
export declare const lcm: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const lcm: (self: bigint, that: bigint): bigint; // overload 2
export declare const max: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const max: (self: bigint, that: bigint): bigint; // overload 2
export declare const min: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const min: (self: bigint, that: bigint): bigint; // overload 2
export declare const multiply: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const multiply: (self: bigint, that: bigint): bigint; // overload 2
export declare const multiplyAll: (collection: Iterable<bigint>): bigint;
export declare const Order: (self: bigint, that: bigint): Ordering;
export declare const remainder: (divisor: bigint): (self: bigint) => bigint; // overload 1
export declare const remainder: (self: bigint, divisor: bigint): bigint; // overload 2
export declare const sign: (n: bigint): Ordering;
export declare const sqrt: (n: bigint): bigint | undefined;
export declare const sqrtUnsafe: (n: bigint): bigint;
export declare const subtract: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const subtract: (self: bigint, that: bigint): bigint; // overload 2
export declare const sum: (that: bigint): (self: bigint) => bigint; // overload 1
export declare const sum: (self: bigint, that: bigint): bigint; // overload 2
export declare const sumAll: (collection: Iterable<bigint>): bigint;
export declare const toNumber: (b: bigint): number | undefined;
```

## Other Exports (Non-Function)

- `CombinerMax` (variable)
- `CombinerMin` (variable)
- `ReducerMultiply` (variable)
- `ReducerSum` (variable)
