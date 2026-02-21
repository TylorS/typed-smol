# API Reference: effect/UndefinedOr

- Import path: `effect/UndefinedOr`
- Source file: `packages/effect/src/UndefinedOr.ts`
- Function exports (callable): 8
- Non-function exports: 0

## Purpose

This module provides small, allocation-free utilities for working with values of type `A | undefined`, where `undefined` means "no value".

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
export declare const getOrThrow: <A>(self: A | undefined): A;
export declare const getOrThrowWith: (onUndefined: () => unknown): <A>(self: A | undefined) => A; // overload 1
export declare const getOrThrowWith: <A>(self: A | undefined, onUndefined: () => unknown): A; // overload 2
export declare const liftThrowable: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => B | undefined;
export declare const makeCombinerFailFast: <A>(combiner: Combiner.Combiner<A>): Combiner.Combiner<A | undefined>;
export declare const makeReducer: <A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<A | undefined>;
export declare const makeReducerFailFast: <A>(reducer: Reducer.Reducer<A>): Reducer.Reducer<A | undefined>;
export declare const map: <A, B>(f: (a: A) => B): (self: A | undefined) => B | undefined; // overload 1
export declare const map: <A, B>(self: A | undefined, f: (a: A) => B): B | undefined; // overload 2
export declare const match: <B, A, C = B>(options: { readonly onUndefined: LazyArg<B>; readonly onDefined: (a: A) => C; }): (self: A | undefined) => B | C; // overload 1
export declare const match: <A, B, C = B>(self: A | undefined, options: { readonly onUndefined: LazyArg<B>; readonly onDefined: (a: A) => C; }): B | C; // overload 2
```

## Other Exports (Non-Function)

- None
