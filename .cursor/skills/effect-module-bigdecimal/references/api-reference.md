# API Reference: effect/BigDecimal

- Import path: `effect/BigDecimal`
- Source file: `packages/effect/src/BigDecimal.ts`
- Function exports (callable): 44
- Non-function exports: 2

## Purpose

This module provides utility functions and type class instances for working with the `BigDecimal` type in TypeScript. It includes functions for basic arithmetic operations.

## Key Function Exports

- `abs`
- `between`
- `ceil`
- `clamp`
- `digitAt`
- `divide`
- `divideUnsafe`
- `equals`
- `Equivalence`
- `floor`
- `format`
- `fromBigInt`
- `fromNumber`
- `fromNumberUnsafe`
- `fromString`
- `fromStringUnsafe`
- `isBigDecimal`
- `isGreaterThan`

## All Function Signatures

```ts
export declare const abs: (n: BigDecimal): BigDecimal;
export declare const between: (options: { minimum: BigDecimal; maximum: BigDecimal; }): (self: BigDecimal) => boolean; // overload 1
export declare const between: (self: BigDecimal, options: { minimum: BigDecimal; maximum: BigDecimal; }): boolean; // overload 2
export declare const ceil: (scale: number): (self: BigDecimal) => BigDecimal; // overload 1
export declare const ceil: (self: BigDecimal, scale?: number): BigDecimal; // overload 2
export declare const clamp: (options: { minimum: BigDecimal; maximum: BigDecimal; }): (self: BigDecimal) => BigDecimal; // overload 1
export declare const clamp: (self: BigDecimal, options: { minimum: BigDecimal; maximum: BigDecimal; }): BigDecimal; // overload 2
export declare const digitAt: (scale: number): (self: BigDecimal) => bigint; // overload 1
export declare const digitAt: (self: BigDecimal, scale: number): bigint; // overload 2
export declare const divide: (that: BigDecimal): (self: BigDecimal) => BigDecimal | undefined; // overload 1
export declare const divide: (self: BigDecimal, that: BigDecimal): BigDecimal | undefined; // overload 2
export declare const divideUnsafe: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const divideUnsafe: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const equals: (that: BigDecimal): (self: BigDecimal) => boolean; // overload 1
export declare const equals: (self: BigDecimal, that: BigDecimal): boolean; // overload 2
export declare const Equivalence: (self: BigDecimal, that: BigDecimal): boolean;
export declare const floor: (scale: number): (self: BigDecimal) => BigDecimal; // overload 1
export declare const floor: (self: BigDecimal, scale?: number): BigDecimal; // overload 2
export declare const format: (n: BigDecimal): string;
export declare const fromBigInt: (n: bigint): BigDecimal;
export declare const fromNumber: (n: number): BigDecimal | undefined;
export declare const fromNumberUnsafe: (n: number): BigDecimal;
export declare const fromString: (s: string): BigDecimal | undefined;
export declare const fromStringUnsafe: (s: string): BigDecimal;
export declare const isBigDecimal: (u: unknown): u is BigDecimal;
export declare const isGreaterThan: (that: BigDecimal): (self: BigDecimal) => boolean; // overload 1
export declare const isGreaterThan: (self: BigDecimal, that: BigDecimal): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: BigDecimal): (self: BigDecimal) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: BigDecimal, that: BigDecimal): boolean; // overload 2
export declare const isInteger: (n: BigDecimal): boolean;
export declare const isLessThan: (that: BigDecimal): (self: BigDecimal) => boolean; // overload 1
export declare const isLessThan: (self: BigDecimal, that: BigDecimal): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: BigDecimal): (self: BigDecimal) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: BigDecimal, that: BigDecimal): boolean; // overload 2
export declare const isNegative: (n: BigDecimal): boolean;
export declare const isPositive: (n: BigDecimal): boolean;
export declare const isZero: (n: BigDecimal): boolean;
export declare const make: (value: bigint, scale: number): BigDecimal;
export declare const makeNormalizedUnsafe: (value: bigint, scale: number): BigDecimal;
export declare const max: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const max: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const min: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const min: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const multiply: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const multiply: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const negate: (n: BigDecimal): BigDecimal;
export declare const normalize: (self: BigDecimal): BigDecimal;
export declare const Order: (self: BigDecimal, that: BigDecimal): Ordering;
export declare const remainder: (divisor: BigDecimal): (self: BigDecimal) => BigDecimal | undefined; // overload 1
export declare const remainder: (self: BigDecimal, divisor: BigDecimal): BigDecimal | undefined; // overload 2
export declare const remainderUnsafe: (divisor: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const remainderUnsafe: (self: BigDecimal, divisor: BigDecimal): BigDecimal; // overload 2
export declare const round: (options: { scale?: number; mode?: RoundingMode; }): (self: BigDecimal) => BigDecimal; // overload 1
export declare const round: (n: BigDecimal, options?: { scale?: number; mode?: RoundingMode; }): BigDecimal; // overload 2
export declare const roundTerminal: (n: bigint): bigint;
export declare const scale: (scale: number): (self: BigDecimal) => BigDecimal; // overload 1
export declare const scale: (self: BigDecimal, scale: number): BigDecimal; // overload 2
export declare const sign: (n: BigDecimal): Ordering;
export declare const subtract: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const subtract: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const sum: (that: BigDecimal): (self: BigDecimal) => BigDecimal; // overload 1
export declare const sum: (self: BigDecimal, that: BigDecimal): BigDecimal; // overload 2
export declare const toExponential: (n: BigDecimal): string;
export declare const toNumberUnsafe: (n: BigDecimal): number;
export declare const truncate: (scale: number): (self: BigDecimal) => BigDecimal; // overload 1
export declare const truncate: (self: BigDecimal, scale?: number): BigDecimal; // overload 2
```

## Other Exports (Non-Function)

- `BigDecimal` (interface)
- `RoundingMode` (type)
