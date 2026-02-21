# API Reference: effect/Ordering

- Import path: `effect/Ordering`
- Source file: `packages/effect/src/Ordering.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

The Ordering module provides utilities for working with comparison results and ordering operations. An Ordering represents the result of comparing two values, expressing whether the first value is less than (-1), equal to (0), or greater than (1) the second value.

## Key Function Exports

- `match`
- `reverse`

## All Function Signatures

```ts
export declare const match: <A, B, C = B>(options: { readonly onLessThan: LazyArg<A>; readonly onEqual: LazyArg<B>; readonly onGreaterThan: LazyArg<C>; }): (self: Ordering) => A | B | C; // overload 1
export declare const match: <A, B, C = B>(o: Ordering, options: { readonly onLessThan: LazyArg<A>; readonly onEqual: LazyArg<B>; readonly onGreaterThan: LazyArg<C>; }): A | B | C; // overload 2
export declare const reverse: (o: Ordering): Ordering;
```

## Other Exports (Non-Function)

- `Ordering` (type)
- `Reducer` (variable)
