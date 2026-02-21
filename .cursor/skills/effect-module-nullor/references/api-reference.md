# API Reference: effect/NullOr

- Import path: `effect/NullOr`
- Source file: `packages/effect/src/NullOr.ts`
- Function exports (callable): 8
- Non-function exports: 0

## Purpose

This module provides small, allocation-free utilities for working with values of type `A | null`, where `null` means "no value".

## Key Function Exports

- `getOrThrow`
- `getOrThrowWith`
- `liftThrowable`
- `makeCombinerFailFast`
- `makeReducer`
- `makeReducerFailFast`
- `map`
- `match`

## All Function Signatures

```ts
export declare const getOrThrow: <A>(self: A | null): A;
export declare const getOrThrowWith: (onNull: () => unknown): <A>(self: A | null) => A; // overload 1
export declare const getOrThrowWith: <A>(self: A | null, onNull: () => unknown): A; // overload 2
export declare const liftThrowable: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => B | null;
export declare const makeCombinerFailFast: <A>(combiner: Combiner.Combiner<A>): Combiner.Combiner<A | null>;
export declare const makeReducer: <A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<A | null>;
export declare const makeReducerFailFast: <A>(reducer: Reducer.Reducer<A>): Reducer.Reducer<A | null>;
export declare const map: <A, B>(f: (a: A) => B): (self: A | null) => B | null; // overload 1
export declare const map: <A, B>(self: A | null, f: (a: A) => B): B | null; // overload 2
export declare const match: <B, A, C = B>(options: { readonly onNull: LazyArg<B>; readonly onNotNull: (a: A) => C; }): (self: A | null) => B | C; // overload 1
export declare const match: <A, B, C = B>(self: A | null, options: { readonly onNull: LazyArg<B>; readonly onNotNull: (a: A) => C; }): B | C; // overload 2
```

## Other Exports (Non-Function)

- None
