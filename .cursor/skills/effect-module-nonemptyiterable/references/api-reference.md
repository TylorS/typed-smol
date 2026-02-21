# API Reference: effect/NonEmptyIterable

- Import path: `effect/NonEmptyIterable`
- Source file: `packages/effect/src/NonEmptyIterable.ts`
- Function exports (callable): 1
- Non-function exports: 2

## Purpose

The `NonEmptyIterable` module provides types and utilities for working with iterables that are guaranteed to contain at least one element. This provides compile-time safety when working with collections that must not be empty.

## Key Function Exports

- `unprepend`

## All Function Signatures

```ts
export declare const unprepend: <A>(self: NonEmptyIterable<A>): [firstElement: A, remainingElements: Iterator<A>];
```

## Other Exports (Non-Function)

- `nonEmpty` (variable)
- `NonEmptyIterable` (interface)
