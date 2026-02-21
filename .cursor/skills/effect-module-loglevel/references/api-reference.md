# API Reference: effect/LogLevel

- Import path: `effect/LogLevel`
- Source file: `packages/effect/src/LogLevel.ts`
- Function exports (callable): 8
- Non-function exports: 2

## Purpose

The `LogLevel` module provides utilities for managing log levels in Effect applications. It defines a hierarchy of log levels and provides functions for comparing and filtering logs based on their severity.

## Key Function Exports

- `Equivalence`
- `getOrdinal`
- `isEnabled`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThan`
- `isLessThanOrEqualTo`
- `Order`

## All Function Signatures

```ts
export declare const Equivalence: (self: LogLevel, that: LogLevel): boolean;
export declare const getOrdinal: (self: LogLevel): number;
export declare const isEnabled: (self: LogLevel): Effect.Effect<boolean>;
export declare const isGreaterThan: (that: LogLevel): (self: LogLevel) => boolean; // overload 1
export declare const isGreaterThan: (self: LogLevel, that: LogLevel): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: LogLevel): (self: LogLevel) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: LogLevel, that: LogLevel): boolean; // overload 2
export declare const isLessThan: (that: LogLevel): (self: LogLevel) => boolean; // overload 1
export declare const isLessThan: (self: LogLevel, that: LogLevel): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: LogLevel): (self: LogLevel) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: LogLevel, that: LogLevel): boolean; // overload 2
export declare const Order: (self: LogLevel, that: LogLevel): Ordering;
```

## Other Exports (Non-Function)

- `LogLevel` (type)
- `values` (variable)
