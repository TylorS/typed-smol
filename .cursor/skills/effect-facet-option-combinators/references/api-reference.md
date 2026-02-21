# API Reference: effect/Option#combinators

- Import path: `effect/Option#combinators`
- Source file: `packages/effect/src/Option.ts`
- Thematic facet: `combinators`
- Function exports (callable): 6
- Non-function exports: 8

## Purpose

The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## Key Function Exports

- `andThen`
- `composeK`
- `makeCombinerFailFast`
- `zipLeft`
- `zipRight`
- `zipWith`

## All Function Signatures

```ts
export declare const andThen: <A, B>(f: (a: A) => Option<B>): (self: Option<A>) => Option<B>; // overload 1
export declare const andThen: <B>(f: Option<B>): <A>(self: Option<A>) => Option<B>; // overload 2
export declare const andThen: <A, B>(f: (a: A) => B): (self: Option<A>) => Option<B>; // overload 3
export declare const andThen: <B>(f: NotFunction<B>): <A>(self: Option<A>) => Option<B>; // overload 4
export declare const andThen: <A, B>(self: Option<A>, f: (a: A) => Option<B>): Option<B>; // overload 5
export declare const andThen: <A, B>(self: Option<A>, f: Option<B>): Option<B>; // overload 6
export declare const andThen: <A, B>(self: Option<A>, f: (a: A) => B): Option<B>; // overload 7
export declare const andThen: <A, B>(self: Option<A>, f: NotFunction<B>): Option<B>; // overload 8
export declare const composeK: <B, C>(bfc: (b: B) => Option<C>): <A>(afb: (a: A) => Option<B>) => (a: A) => Option<C>; // overload 1
export declare const composeK: <A, B, C>(afb: (a: A) => Option<B>, bfc: (b: B) => Option<C>): (a: A) => Option<C>; // overload 2
export declare const makeCombinerFailFast: <A>(combiner: Combiner.Combiner<A>): Combiner.Combiner<Option<A>>;
export declare const zipLeft: <_>(that: Option<_>): <A>(self: Option<A>) => Option<A>; // overload 1
export declare const zipLeft: <A, X>(self: Option<A>, that: Option<X>): Option<A>; // overload 2
export declare const zipRight: <B>(that: Option<B>): <_>(self: Option<_>) => Option<B>; // overload 1
export declare const zipRight: <X, B>(self: Option<X>, that: Option<B>): Option<B>; // overload 2
export declare const zipWith: <B, A, C>(that: Option<B>, f: (a: A, b: B) => C): (self: Option<A>) => Option<C>; // overload 1
export declare const zipWith: <A, B, C>(self: Option<A>, that: Option<B>, f: (a: A, b: B) => C): Option<C>; // overload 2
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
