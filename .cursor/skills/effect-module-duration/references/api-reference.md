# API Reference: effect/Duration

- Import path: `effect/Duration`
- Source file: `packages/effect/src/Duration.ts`
- Function exports (callable): 46
- Non-function exports: 10

## Purpose

This module provides utilities for working with durations of time. A `Duration` is an immutable data type that represents a span of time with high precision, supporting operations from nanoseconds to weeks.

## Key Function Exports

- `abs`
- `between`
- `clamp`
- `days`
- `divide`
- `divideUnsafe`
- `equals`
- `Equivalence`
- `format`
- `fromInput`
- `fromInputUnsafe`
- `hours`
- `isDuration`
- `isFinite`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThan`
- `isLessThanOrEqualTo`

## All Function Signatures

```ts
export declare const abs: (self: Duration): Duration;
export declare const between: (options: { minimum: Duration; maximum: Duration; }): (self: Duration) => boolean; // overload 1
export declare const between: (self: Duration, options: { minimum: Duration; maximum: Duration; }): boolean; // overload 2
export declare const clamp: (options: { minimum: Duration; maximum: Duration; }): (self: Duration) => Duration; // overload 1
export declare const clamp: (self: Duration, options: { minimum: Duration; maximum: Duration; }): Duration; // overload 2
export declare const days: (days: number): Duration;
export declare const divide: (by: number): (self: Duration) => Duration | undefined; // overload 1
export declare const divide: (self: Duration, by: number): Duration | undefined; // overload 2
export declare const divideUnsafe: (by: number): (self: Duration) => Duration; // overload 1
export declare const divideUnsafe: (self: Duration, by: number): Duration; // overload 2
export declare const equals: (that: Duration): (self: Duration) => boolean; // overload 1
export declare const equals: (self: Duration, that: Duration): boolean; // overload 2
export declare const Equivalence: (self: Duration, that: Duration): boolean;
export declare const format: (self: Duration): string;
export declare const fromInput: (u: Input): Duration | undefined;
export declare const fromInputUnsafe: (input: Input): Duration;
export declare const hours: (hours: number): Duration;
export declare const isDuration: (u: unknown): u is Duration;
export declare const isFinite: (self: Duration): boolean;
export declare const isGreaterThan: (that: Duration): (self: Duration) => boolean; // overload 1
export declare const isGreaterThan: (self: Duration, that: Duration): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: Duration): (self: Duration) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: Duration, that: Duration): boolean; // overload 2
export declare const isLessThan: (that: Duration): (self: Duration) => boolean; // overload 1
export declare const isLessThan: (self: Duration, that: Duration): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: Duration): (self: Duration) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: Duration, that: Duration): boolean; // overload 2
export declare const isNegative: (self: Duration): boolean;
export declare const isPositive: (self: Duration): boolean;
export declare const isZero: (self: Duration): boolean;
export declare const match: <A, B, C, D = C>(options: { readonly onMillis: (millis: number) => A; readonly onNanos: (nanos: bigint) => B; readonly onInfinity: () => C; readonly onNegativeInfinity?: () => D; }): (self: Duration) => A | B | C | D; // overload 1
export declare const match: <A, B, C, D = C>(self: Duration, options: { readonly onMillis: (millis: number) => A; readonly onNanos: (nanos: bigint) => B; readonly onInfinity: () => C; readonly onNegativeInfinity?: () => D; }): A | B | C | D; // overload 2
export declare const matchPair: <A, B, C>(that: Duration, options: { readonly onMillis: (self: number, that: number) => A; readonly onNanos: (self: bigint, that: bigint) => B; readonly onInfinity: (self: Duration, that: Duration) => C; }): (self: Duration) => A | B | C; // overload 1
export declare const matchPair: <A, B, C>(self: Duration, that: Duration, options: { readonly onMillis: (self: number, that: number) => A; readonly onNanos: (self: bigint, that: bigint) => B; readonly onInfinity: (self: Duration, that: Duration) => C; }): A | B | C; // overload 2
export declare const max: (that: Duration): (self: Duration) => Duration; // overload 1
export declare const max: (self: Duration, that: Duration): Duration; // overload 2
export declare const micros: (micros: bigint): Duration;
export declare const millis: (millis: number): Duration;
export declare const min: (that: Duration): (self: Duration) => Duration; // overload 1
export declare const min: (self: Duration, that: Duration): Duration; // overload 2
export declare const minutes: (minutes: number): Duration;
export declare const nanos: (nanos: bigint): Duration;
export declare const negate: (self: Duration): Duration;
export declare const Order: (self: Duration, that: Duration): Ordering;
export declare const parts: (self: Duration): { days: number; hours: number; minutes: number; seconds: number; millis: number; nanos: number; };
export declare const seconds: (seconds: number): Duration;
export declare const subtract: (that: Duration): (self: Duration) => Duration; // overload 1
export declare const subtract: (self: Duration, that: Duration): Duration; // overload 2
export declare const sum: (that: Duration): (self: Duration) => Duration; // overload 1
export declare const sum: (self: Duration, that: Duration): Duration; // overload 2
export declare const times: (times: number): (self: Duration) => Duration; // overload 1
export declare const times: (self: Duration, times: number): Duration; // overload 2
export declare const toDays: (self: Duration): number;
export declare const toHours: (self: Duration): number;
export declare const toHrTime: (self: Duration): [seconds: number, nanos: number];
export declare const toMillis: (self: Input): number;
export declare const toMinutes: (self: Duration): number;
export declare const toNanos: (self: Duration): bigint | undefined;
export declare const toNanosUnsafe: (self: Duration): bigint;
export declare const toSeconds: (self: Duration): number;
export declare const toWeeks: (self: Duration): number;
export declare const weeks: (weeks: number): Duration;
```

## Other Exports (Non-Function)

- `CombinerMax` (variable)
- `CombinerMin` (variable)
- `Duration` (interface)
- `DurationValue` (type)
- `infinity` (variable)
- `Input` (type)
- `negativeInfinity` (variable)
- `ReducerSum` (variable)
- `Unit` (type)
- `zero` (variable)
