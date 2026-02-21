# API Reference: effect/Option#core

- Import path: `effect/Option#core`
- Source file: `packages/effect/src/Option.ts`
- Thematic facet: `core`
- Function exports (callable): 16
- Non-function exports: 8

## Purpose

The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## Key Function Exports

- `fromIterable`
- `fromNullishOr`
- `fromNullOr`
- `fromUndefinedOr`
- `getFailure`
- `getOrElse`
- `getOrNull`
- `getOrThrow`
- `getOrThrowWith`
- `getOrUndefined`
- `getSuccess`
- `makeCombinerFailFast`
- `makeEquivalence`
- `makeOrder`
- `makeReducer`
- `makeReducerFailFast`

## All Function Signatures

```ts
export declare const fromIterable: <A>(collection: Iterable<A>): Option<A>;
export declare const fromNullishOr: <A>(a: A): Option<NonNullable<A>>;
export declare const fromNullOr: <A>(a: A): Option<Exclude<A, null>>;
export declare const fromUndefinedOr: <A>(a: A): Option<Exclude<A, undefined>>;
export declare const getFailure: <A, E>(self: Result<A, E>): Option<E>;
export declare const getOrElse: <B>(onNone: LazyArg<B>): <A>(self: Option<A>) => B | A; // overload 1
export declare const getOrElse: <A, B>(self: Option<A>, onNone: LazyArg<B>): A | B; // overload 2
export declare const getOrNull: <A>(self: Option<A>): A | null;
export declare const getOrThrow: <A>(self: Option<A>): A;
export declare const getOrThrowWith: (onNone: () => unknown): <A>(self: Option<A>) => A; // overload 1
export declare const getOrThrowWith: <A>(self: Option<A>, onNone: () => unknown): A; // overload 2
export declare const getOrUndefined: <A>(self: Option<A>): A | undefined;
export declare const getSuccess: <A, E>(self: Result<A, E>): Option<A>;
export declare const makeCombinerFailFast: <A>(combiner: Combiner.Combiner<A>): Combiner.Combiner<Option<A>>;
export declare const makeEquivalence: <A>(isEquivalent: Equivalence.Equivalence<A>): Equivalence.Equivalence<Option<A>>;
export declare const makeOrder: <A>(O: Order<A>): Order<Option<A>>;
export declare const makeReducer: <A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<Option<A>>;
export declare const makeReducerFailFast: <A>(reducer: Reducer.Reducer<A>): Reducer.Reducer<Option<A>>;
```

## Other Exports (Non-Function)

- `Do` (variable)
- `None` (interface)
- `Option` (type)
- `OptionTypeLambda` (interface)
- `OptionUnify` (interface)
- `OptionUnifyIgnore` (interface)
- `Some` (interface)
- `void` (variable)
