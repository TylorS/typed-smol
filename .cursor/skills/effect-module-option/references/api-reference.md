# API Reference: effect/Option

- Import path: `effect/Option`
- Source file: `packages/effect/src/Option.ts`
- Function exports (callable): 58
- Non-function exports: 8

## Purpose

The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## Key Function Exports

- `all`
- `andThen`
- `as`
- `asVoid`
- `bind`
- `bindTo`
- `composeK`
- `contains`
- `containsWith`
- `exists`
- `filter`
- `filterMap`
- `firstSomeOf`
- `flatMap`
- `flatMapNullishOr`
- `flatten`
- `fromIterable`
- `fromNullishOr`

## All Function Signatures

```ts
export declare const all: <const I extends Iterable<Option<any>> | Record<string, Option<any>>>(input: I): [I] extends [ReadonlyArray<Option<any>>] ? Option<{ -readonly [K in keyof I]: [I[K]] extends [Option<infer A>] ? A : never; }> : [I] extends [Iterable<Option<infer A>>] ? Option<Array<A>> : Option<{ -readonly [K in keyof I]: [I[K]] extends [Option<infer A>] ? A : never; }>;
export declare const andThen: <A, B>(f: (a: A) => Option<B>): (self: Option<A>) => Option<B>; // overload 1
export declare const andThen: <B>(f: Option<B>): <A>(self: Option<A>) => Option<B>; // overload 2
export declare const andThen: <A, B>(f: (a: A) => B): (self: Option<A>) => Option<B>; // overload 3
export declare const andThen: <B>(f: NotFunction<B>): <A>(self: Option<A>) => Option<B>; // overload 4
export declare const andThen: <A, B>(self: Option<A>, f: (a: A) => Option<B>): Option<B>; // overload 5
export declare const andThen: <A, B>(self: Option<A>, f: Option<B>): Option<B>; // overload 6
export declare const andThen: <A, B>(self: Option<A>, f: (a: A) => B): Option<B>; // overload 7
export declare const andThen: <A, B>(self: Option<A>, f: NotFunction<B>): Option<B>; // overload 8
export declare const as: <B>(b: B): <X>(self: Option<X>) => Option<B>; // overload 1
export declare const as: <X, B>(self: Option<X>, b: B): Option<B>; // overload 2
export declare const asVoid: <_>(self: Option<_>): Option<void>;
export declare const bind: <N extends string, A extends object, B>(name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => Option<B>): (self: Option<A>) => Option<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 1
export declare const bind: <A extends object, N extends string, B>(self: Option<A>, name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => Option<B>): Option<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 2
export declare const bindTo: <N extends string>(name: N): <A>(self: Option<A>) => Option<{ [K in N]: A; }>; // overload 1
export declare const bindTo: <A, N extends string>(self: Option<A>, name: N): Option<{ [K in N]: A; }>; // overload 2
export declare const composeK: <B, C>(bfc: (b: B) => Option<C>): <A>(afb: (a: A) => Option<B>) => (a: A) => Option<C>; // overload 1
export declare const composeK: <A, B, C>(afb: (a: A) => Option<B>, bfc: (b: B) => Option<C>): (a: A) => Option<C>; // overload 2
export declare const contains: <A>(a: A): (self: Option<A>) => boolean; // overload 1
export declare const contains: <A>(self: Option<A>, a: A): boolean; // overload 2
export declare const containsWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (a: A): (self: Option<A>) => boolean; (self: Option<A>, a: A): boolean; };
export declare const exists: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Option<A>) => self is Option<B>; // overload 1
export declare const exists: <A>(predicate: Predicate<NoInfer<A>>): (self: Option<A>) => boolean; // overload 2
export declare const exists: <A, B extends A>(self: Option<A>, refinement: Refinement<A, B>): self is Option<B>; // overload 3
export declare const exists: <A>(self: Option<A>, predicate: Predicate<A>): boolean; // overload 4
export declare const filter: <A, B extends A>(refinement: Refinement<A, B>): (self: Option<A>) => Option<B>; // overload 1
export declare const filter: <A>(predicate: Predicate<A>): <B extends A>(self: Option<B>) => Option<B>; // overload 2
export declare const filter: <A, B extends A>(self: Option<A>, refinement: Refinement<A, B>): Option<B>; // overload 3
export declare const filter: <A>(self: Option<A>, predicate: Predicate<A>): Option<A>; // overload 4
export declare const filterMap: <A, B>(f: (a: A) => Option<B>): (self: Option<A>) => Option<B>; // overload 1
export declare const filterMap: <A, B>(self: Option<A>, f: (a: A) => Option<B>): Option<B>; // overload 2
export declare const firstSomeOf: <T, C extends Iterable<Option<T>> = Iterable<Option<T>>>(collection: C): [C] extends [Iterable<Option<infer A>>] ? Option<A> : never;
export declare const flatMap: <A, B>(f: (a: A) => Option<B>): (self: Option<A>) => Option<B>; // overload 1
export declare const flatMap: <A, B>(self: Option<A>, f: (a: A) => Option<B>): Option<B>; // overload 2
export declare const flatMapNullishOr: <A, B>(f: (a: A) => B): (self: Option<A>) => Option<NonNullable<B>>; // overload 1
export declare const flatMapNullishOr: <A, B>(self: Option<A>, f: (a: A) => B): Option<NonNullable<B>>; // overload 2
export declare const flatten: <A>(self: Option<Option<A>>): Option<A>;
export declare const fromIterable: <A>(collection: Iterable<A>): Option<A>;
export declare const fromNullishOr: <A>(a: A): Option<NonNullable<A>>;
export declare const fromNullOr: <A>(a: A): Option<Exclude<A, null>>;
export declare const fromUndefinedOr: <A>(a: A): Option<Exclude<A, undefined>>;
export declare const gen: <Self, K extends Option<any> | Gen.Variance<OptionTypeLambda, any, any, any>, A>(...args: [self: Self, body: (this: Self) => Generator<K, A, never>] | [body: () => Generator<K, A, never>]): Option<A>;
export declare const getFailure: <A, E>(self: Result<A, E>): Option<E>;
export declare const getOrElse: <B>(onNone: LazyArg<B>): <A>(self: Option<A>) => B | A; // overload 1
export declare const getOrElse: <A, B>(self: Option<A>, onNone: LazyArg<B>): A | B; // overload 2
export declare const getOrNull: <A>(self: Option<A>): A | null;
export declare const getOrThrow: <A>(self: Option<A>): A;
export declare const getOrThrowWith: (onNone: () => unknown): <A>(self: Option<A>) => A; // overload 1
export declare const getOrThrowWith: <A>(self: Option<A>, onNone: () => unknown): A; // overload 2
export declare const getOrUndefined: <A>(self: Option<A>): A | undefined;
export declare const getSuccess: <A, E>(self: Result<A, E>): Option<A>;
export declare const isNone: <A>(self: Option<A>): self is None<A>;
export declare const isOption: (input: unknown): input is Option<unknown>;
export declare const isSome: <A>(self: Option<A>): self is Some<A>;
export declare const let: <N extends string, A extends object, B>(name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): (self: Option<A>) => Option<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 1
export declare const let: <A extends object, N extends string, B>(self: Option<A>, name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): Option<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 2
export declare const lift2: <A, B, C>(f: (a: A, b: B) => C): { (that: Option<B>): (self: Option<A>) => Option<C>; (self: Option<A>, that: Option<B>): Option<C>; };
export declare const liftNullishOr: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => Option<NonNullable<B>>;
export declare const liftPredicate: <A, B extends A>(refinement: Refinement<A, B>): (a: A) => Option<B>; // overload 1
export declare const liftPredicate: <B extends A, A = B>(predicate: Predicate<A>): (b: B) => Option<B>; // overload 2
export declare const liftPredicate: <A, B extends A>(self: A, refinement: Refinement<A, B>): Option<B>; // overload 3
export declare const liftPredicate: <B extends A, A = B>(self: B, predicate: Predicate<A>): Option<B>; // overload 4
export declare const liftThrowable: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (...a: A) => Option<B>;
export declare const makeCombinerFailFast: <A>(combiner: Combiner.Combiner<A>): Combiner.Combiner<Option<A>>;
export declare const makeEquivalence: <A>(isEquivalent: Equivalence.Equivalence<A>): Equivalence.Equivalence<Option<A>>;
export declare const makeOrder: <A>(O: Order<A>): Order<Option<A>>;
export declare const makeReducer: <A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<Option<A>>;
export declare const makeReducerFailFast: <A>(reducer: Reducer.Reducer<A>): Reducer.Reducer<Option<A>>;
export declare const map: <A, B>(f: (a: A) => B): (self: Option<A>) => Option<B>; // overload 1
export declare const map: <A, B>(self: Option<A>, f: (a: A) => B): Option<B>; // overload 2
export declare const match: <B, A, C = B>(options: { readonly onNone: LazyArg<B>; readonly onSome: (a: A) => C; }): (self: Option<A>) => B | C; // overload 1
export declare const match: <A, B, C = B>(self: Option<A>, options: { readonly onNone: LazyArg<B>; readonly onSome: (a: A) => C; }): B | C; // overload 2
export declare const none: <A = never>(): Option<A>;
export declare const orElse: <B>(that: LazyArg<Option<B>>): <A>(self: Option<A>) => Option<B | A>; // overload 1
export declare const orElse: <A, B>(self: Option<A>, that: LazyArg<Option<B>>): Option<A | B>; // overload 2
export declare const orElseResult: <B>(that: LazyArg<Option<B>>): <A>(self: Option<A>) => Option<Result<B, A>>; // overload 1
export declare const orElseResult: <A, B>(self: Option<A>, that: LazyArg<Option<B>>): Option<Result<B, A>>; // overload 2
export declare const orElseSome: <B>(onNone: LazyArg<B>): <A>(self: Option<A>) => Option<B | A>; // overload 1
export declare const orElseSome: <A, B>(self: Option<A>, onNone: LazyArg<B>): Option<A | B>; // overload 2
export declare const partitionMap: <A, B, C>(f: (a: A) => Result<C, B>): (self: Option<A>) => [left: Option<B>, right: Option<C>]; // overload 1
export declare const partitionMap: <A, B, C>(self: Option<A>, f: (a: A) => Result<C, B>): [left: Option<B>, right: Option<C>]; // overload 2
export declare const product: <A, B>(self: Option<A>, that: Option<B>): Option<[A, B]>;
export declare const productMany: <A>(self: Option<A>, collection: Iterable<Option<A>>): Option<[A, ...Array<A>]>;
export declare const reduceCompact: <B, A>(b: B, f: (b: B, a: A) => B): (self: Iterable<Option<A>>) => B; // overload 1
export declare const reduceCompact: <A, B>(self: Iterable<Option<A>>, b: B, f: (b: B, a: A) => B): B; // overload 2
export declare const some: <A>(value: A): Option<A>;
export declare const tap: <A, X>(f: (a: A) => Option<X>): (self: Option<A>) => Option<A>; // overload 1
export declare const tap: <A, X>(self: Option<A>, f: (a: A) => Option<X>): Option<A>; // overload 2
export declare const toArray: <A>(self: Option<A>): Array<A>;
export declare const toRefinement: <A, B extends A>(f: (a: A) => Option<B>): (a: A) => a is B;
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
