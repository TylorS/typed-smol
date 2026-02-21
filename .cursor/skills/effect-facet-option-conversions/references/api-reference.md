# API Reference: effect/Option#conversions

- Import path: `effect/Option#conversions`
- Source file: `packages/effect/src/Option.ts`
- Thematic facet: `conversions`
- Function exports (callable): 19
- Non-function exports: 8

## Purpose

The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## Key Function Exports

- `bindTo`
- `fromIterable`
- `fromNullishOr`
- `fromNullOr`
- `fromUndefinedOr`
- `getOrElse`
- `getOrNull`
- `getOrThrow`
- `getOrThrowWith`
- `getOrUndefined`
- `lift2`
- `liftNullishOr`
- `liftPredicate`
- `liftThrowable`
- `orElse`
- `orElseResult`
- `orElseSome`
- `toArray`

## All Function Signatures

```ts
export declare const bindTo: <N extends string>(name: N): <A>(self: Option<A>) => Option<{ [K in N]: A; }>; // overload 1
export declare const bindTo: <A, N extends string>(self: Option<A>, name: N): Option<{ [K in N]: A; }>; // overload 2
export declare const fromIterable: <A>(collection: Iterable<A>): Option<A>;
export declare const fromNullishOr: <A>(a: A): Option<NonNullable<A>>;
export declare const fromNullOr: <A>(a: A): Option<Exclude<A, null>>;
export declare const fromUndefinedOr: <A>(a: A): Option<Exclude<A, undefined>>;
export declare const getOrElse: <B>(onNone: LazyArg<B>): <A>(self: Option<A>) => B | A; // overload 1
export declare const getOrElse: <A, B>(self: Option<A>, onNone: LazyArg<B>): A | B; // overload 2
export declare const getOrNull: <A>(self: Option<A>): A | null;
export declare const getOrThrow: <A>(self: Option<A>): A;
export declare const getOrThrowWith: (onNone: () => unknown): <A>(self: Option<A>) => A; // overload 1
export declare const getOrThrowWith: <A>(self: Option<A>, onNone: () => unknown): A; // overload 2
export declare const getOrUndefined: <A>(self: Option<A>): A | undefined;
export declare const lift2: <A, B, C>(f: (a: A, b: B) => C): { (that: Option<B>): (self: Option<A>) => Option<C>; (self: Option<A>, that: Option<B>): Option<C>; };
export declare const liftNullishOr: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => Option<NonNullable<B>>;
export declare const liftPredicate: <A, B extends A>(refinement: Refinement<A, B>): (a: A) => Option<B>; // overload 1
export declare const liftPredicate: <B extends A, A = B>(predicate: Predicate<A>): (b: B) => Option<B>; // overload 2
export declare const liftPredicate: <A, B extends A>(self: A, refinement: Refinement<A, B>): Option<B>; // overload 3
export declare const liftPredicate: <B extends A, A = B>(self: B, predicate: Predicate<A>): Option<B>; // overload 4
export declare const liftThrowable: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => Option<B>;
export declare const orElse: <B>(that: LazyArg<Option<B>>): <A>(self: Option<A>) => Option<B | A>; // overload 1
export declare const orElse: <A, B>(self: Option<A>, that: LazyArg<Option<B>>): Option<A | B>; // overload 2
export declare const orElseResult: <B>(that: LazyArg<Option<B>>): <A>(self: Option<A>) => Option<Result<B, A>>; // overload 1
export declare const orElseResult: <A, B>(self: Option<A>, that: LazyArg<Option<B>>): Option<Result<B, A>>; // overload 2
export declare const orElseSome: <B>(onNone: LazyArg<B>): <A>(self: Option<A>) => Option<B | A>; // overload 1
export declare const orElseSome: <A, B>(self: Option<A>, onNone: LazyArg<B>): Option<A | B>; // overload 2
export declare const toArray: <A>(self: Option<A>): Array<A>;
export declare const toRefinement: <A, B extends A>(f: (a: A) => Option<B>): (a: A) => a is B;
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
