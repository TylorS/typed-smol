# API Reference: effect/Reducer

- Import path: `effect/Reducer`
- Source file: `packages/effect/src/Reducer.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

A module for reducing collections of values into a single result.

## Key Function Exports

- `flip`
- `make`

## All Function Signatures

```ts
export declare const flip: <A>(reducer: Reducer<A>): Reducer<A>;
export declare const make: <A>(combine: (self: A, that: A) => A, initialValue: A, combineAll?: (collection: Iterable<A>) => A): Reducer<A>;
```

## Other Exports (Non-Function)

- `Reducer` (interface)
