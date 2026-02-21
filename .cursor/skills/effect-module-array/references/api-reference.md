# API Reference: effect/Array

- Import path: `effect/Array`
- Source file: `packages/effect/src/Array.ts`
- Function exports (callable): 130
- Non-function exports: 5

## Purpose

Utilities for working with immutable arrays (and non-empty arrays) in a functional style. All functions treat arrays as immutable — they return new arrays rather than mutating the input.

## Key Function Exports

- `allocate`
- `append`
- `appendAll`
- `Array`
- `bind`
- `bindTo`
- `cartesian`
- `cartesianWith`
- `chop`
- `chunksOf`
- `contains`
- `containsWith`
- `copy`
- `countBy`
- `dedupe`
- `dedupeAdjacent`
- `dedupeAdjacentWith`
- `dedupeWith`

## All Function Signatures

```ts
export declare const allocate: <A = never>(n: number): Array<A | undefined>;
export declare const append: <B>(last: B): <A>(self: Iterable<A>) => NonEmptyArray<A | B>; // overload 1
export declare const append: <A, B>(self: Iterable<A>, last: B): NonEmptyArray<A | B>; // overload 2
export declare const appendAll: <S extends Iterable<any>, T extends Iterable<any>>(that: T): (self: S) => ReadonlyArray.OrNonEmpty<S, T, ReadonlyArray.Infer<S> | ReadonlyArray.Infer<T>>; // overload 1
export declare const appendAll: <A, B>(self: Iterable<A>, that: NonEmptyReadonlyArray<B>): NonEmptyArray<A | B>; // overload 2
export declare const appendAll: <A, B>(self: NonEmptyReadonlyArray<A>, that: Iterable<B>): NonEmptyArray<A | B>; // overload 3
export declare const appendAll: <A, B>(self: Iterable<A>, that: Iterable<B>): Array<A | B>; // overload 4
export declare const Array: (arrayLength?: number): any[]; // overload 1
export declare const Array: <T>(arrayLength: number): T[]; // overload 2
export declare const Array: <T>(...items: T[]): T[]; // overload 3
export declare const bind: <A extends object, N extends string, B>(tag: Exclude<N, keyof A>, f: (a: NoInfer<A>) => ReadonlyArray<B>): (self: ReadonlyArray<A>) => Array<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 1
export declare const bind: <A extends object, N extends string, B>(self: ReadonlyArray<A>, tag: Exclude<N, keyof A>, f: (a: NoInfer<A>) => ReadonlyArray<B>): Array<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 2
export declare const bindTo: <N extends string>(tag: N): <A>(self: ReadonlyArray<A>) => Array<{ [K in N]: A; }>; // overload 1
export declare const bindTo: <A, N extends string>(self: ReadonlyArray<A>, tag: N): Array<{ [K in N]: A; }>; // overload 2
export declare const cartesian: <B>(that: ReadonlyArray<B>): <A>(self: ReadonlyArray<A>) => Array<[A, B]>; // overload 1
export declare const cartesian: <A, B>(self: ReadonlyArray<A>, that: ReadonlyArray<B>): Array<[A, B]>; // overload 2
export declare const cartesianWith: <A, B, C>(that: ReadonlyArray<B>, f: (a: A, b: B) => C): (self: ReadonlyArray<A>) => Array<C>; // overload 1
export declare const cartesianWith: <A, B, C>(self: ReadonlyArray<A>, that: ReadonlyArray<B>, f: (a: A, b: B) => C): Array<C>; // overload 2
export declare const chop: <S extends Iterable<any>, B>(f: (as: NonEmptyReadonlyArray<ReadonlyArray.Infer<S>>) => readonly [B, ReadonlyArray<ReadonlyArray.Infer<S>>]): (self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S>>; // overload 1
export declare const chop: <A, B>(self: NonEmptyReadonlyArray<A>, f: (as: NonEmptyReadonlyArray<A>) => readonly [B, ReadonlyArray<A>]): NonEmptyArray<B>; // overload 2
export declare const chop: <A, B>(self: Iterable<A>, f: (as: NonEmptyReadonlyArray<A>) => readonly [B, ReadonlyArray<A>]): Array<B>; // overload 3
export declare const chunksOf: (n: number): <S extends Iterable<any>>(self: S) => ReadonlyArray.With<S, NonEmptyArray<ReadonlyArray.Infer<S>>>; // overload 1
export declare const chunksOf: <A>(self: NonEmptyReadonlyArray<A>, n: number): NonEmptyArray<NonEmptyArray<A>>; // overload 2
export declare const chunksOf: <A>(self: Iterable<A>, n: number): Array<NonEmptyArray<A>>; // overload 3
export declare const contains: <A>(a: A): (self: Iterable<A>) => boolean; // overload 1
export declare const contains: <A>(self: Iterable<A>, a: A): boolean; // overload 2
export declare const containsWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (a: A): (self: Iterable<A>) => boolean; (self: Iterable<A>, a: A): boolean; };
export declare const copy: <A>(self: NonEmptyReadonlyArray<A>): NonEmptyArray<A>; // overload 1
export declare const copy: <A>(self: ReadonlyArray<A>): Array<A>; // overload 2
export declare const countBy: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => number; // overload 1
export declare const countBy: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): number; // overload 2
export declare const dedupe: <S extends Iterable<any>>(self: S): S extends NonEmptyReadonlyArray<infer A> ? NonEmptyArray<A> : S extends Iterable<infer A> ? Array<A> : never;
export declare const dedupeAdjacent: <A>(self: Iterable<A>): Array<A>;
export declare const dedupeAdjacentWith: <A>(isEquivalent: (self: A, that: A) => boolean): (self: Iterable<A>) => Array<A>; // overload 1
export declare const dedupeAdjacentWith: <A>(self: Iterable<A>, isEquivalent: (self: A, that: A) => boolean): Array<A>; // overload 2
export declare const dedupeWith: <S extends Iterable<any>>(isEquivalent: (self: ReadonlyArray.Infer<S>, that: ReadonlyArray.Infer<S>) => boolean): (self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S>>; // overload 1
export declare const dedupeWith: <A>(self: NonEmptyReadonlyArray<A>, isEquivalent: (self: A, that: A) => boolean): NonEmptyArray<A>; // overload 2
export declare const dedupeWith: <A>(self: Iterable<A>, isEquivalent: (self: A, that: A) => boolean): Array<A>; // overload 3
export declare const difference: <A>(that: Iterable<A>): (self: Iterable<A>) => Array<A>; // overload 1
export declare const difference: <A>(self: Iterable<A>, that: Iterable<A>): Array<A>; // overload 2
export declare const differenceWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (that: Iterable<A>): (self: Iterable<A>) => Array<A>; (self: Iterable<A>, that: Iterable<A>): Array<A>; };
export declare const drop: (n: number): <A>(self: Iterable<A>) => Array<A>; // overload 1
export declare const drop: <A>(self: Iterable<A>, n: number): Array<A>; // overload 2
export declare const dropRight: (n: number): <A>(self: Iterable<A>) => Array<A>; // overload 1
export declare const dropRight: <A>(self: Iterable<A>, n: number): Array<A>; // overload 2
export declare const dropWhile: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Array<A>; // overload 1
export declare const dropWhile: <A, B, X>(f: Filter.Filter<NoInfer<A>, B, X>): (self: Iterable<A>) => Array<A>; // overload 2
export declare const dropWhile: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Array<A>; // overload 3
export declare const dropWhile: <A, B, X>(self: Iterable<A>, f: Filter.Filter<A, B, X>): Array<A>; // overload 4
export declare const empty: <A = never>(): Array<A>;
export declare const ensure: <A>(self: ReadonlyArray<A> | A): Array<A>;
export declare const every: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: ReadonlyArray<A>) => self is ReadonlyArray<B>; // overload 1
export declare const every: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: ReadonlyArray<A>) => boolean; // overload 2
export declare const every: <A, B extends A>(self: ReadonlyArray<A>, refinement: (a: A, i: number) => a is B): self is ReadonlyArray<B>; // overload 3
export declare const every: <A>(self: ReadonlyArray<A>, predicate: (a: A, i: number) => boolean): boolean; // overload 4
export declare const extend: <A, B>(f: (as: ReadonlyArray<A>) => B): (self: ReadonlyArray<A>) => Array<B>; // overload 1
export declare const extend: <A, B>(self: ReadonlyArray<A>, f: (as: ReadonlyArray<A>) => B): Array<B>; // overload 2
export declare const filter: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Array<B>; // overload 1
export declare const filter: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Array<A>; // overload 2
export declare const filter: <A, B, X>(f: Filter.Filter<NoInfer<A>, B, X>): (self: Iterable<A>) => Array<B>; // overload 3
export declare const filter: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Array<B>; // overload 4
export declare const filter: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Array<A>; // overload 5
export declare const filter: <A, B, X>(self: Iterable<A>, f: Filter.Filter<A, B, X>): Array<B>; // overload 6
export declare const findFirst: <A, B>(f: (a: NoInfer<A>, i: number) => Option.Option<B>): (self: Iterable<A>) => Option.Option<B>; // overload 1
export declare const findFirst: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Option.Option<B>; // overload 2
export declare const findFirst: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Option.Option<A>; // overload 3
export declare const findFirst: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option.Option<B>): Option.Option<B>; // overload 4
export declare const findFirst: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Option.Option<B>; // overload 5
export declare const findFirst: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Option.Option<A>; // overload 6
export declare const findFirstIndex: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => number | undefined; // overload 1
export declare const findFirstIndex: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): number | undefined; // overload 2
export declare const findFirstWithIndex: <A, B>(f: (a: NoInfer<A>, i: number) => Option.Option<B>): (self: Iterable<A>) => [B, number] | undefined; // overload 1
export declare const findFirstWithIndex: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => [B, number] | undefined; // overload 2
export declare const findFirstWithIndex: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => [A, number] | undefined; // overload 3
export declare const findFirstWithIndex: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option.Option<B>): [B, number] | undefined; // overload 4
export declare const findFirstWithIndex: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): [B, number] | undefined; // overload 5
export declare const findFirstWithIndex: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): [A, number] | undefined; // overload 6
export declare const findLast: <A, B>(f: (a: NoInfer<A>, i: number) => Option.Option<B>): (self: Iterable<A>) => Option.Option<B>; // overload 1
export declare const findLast: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Option.Option<B>; // overload 2
export declare const findLast: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Option.Option<A>; // overload 3
export declare const findLast: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option.Option<B>): Option.Option<B>; // overload 4
export declare const findLast: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Option.Option<B>; // overload 5
export declare const findLast: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Option.Option<A>; // overload 6
export declare const findLastIndex: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => number | undefined; // overload 1
export declare const findLastIndex: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): number | undefined; // overload 2
export declare const flatMap: <S extends ReadonlyArray<any>, T extends ReadonlyArray<any>>(f: (a: ReadonlyArray.Infer<S>, i: number) => T): (self: S) => ReadonlyArray.AndNonEmpty<S, T, ReadonlyArray.Infer<T>>; // overload 1
export declare const flatMap: <A, B>(self: NonEmptyReadonlyArray<A>, f: (a: A, i: number) => NonEmptyReadonlyArray<B>): NonEmptyArray<B>; // overload 2
export declare const flatMap: <A, B>(self: ReadonlyArray<A>, f: (a: A, i: number) => ReadonlyArray<B>): Array<B>; // overload 3
export declare const flatMapNullishOr: <A, B>(f: (a: A) => B): (self: ReadonlyArray<A>) => Array<NonNullable<B>>; // overload 1
export declare const flatMapNullishOr: <A, B>(self: ReadonlyArray<A>, f: (a: A) => B): Array<NonNullable<B>>; // overload 2
export declare const flatten: <const S extends ReadonlyArray<ReadonlyArray<any>>>(self: S): ReadonlyArray.Flatten<S>;
export declare const forEach: <A>(f: (a: A, i: number) => void): (self: Iterable<A>) => void; // overload 1
export declare const forEach: <A>(self: Iterable<A>, f: (a: A, i: number) => void): void; // overload 2
export declare const fromIterable: <A>(collection: Iterable<A>): Array<A>;
export declare const fromNullishOr: <A>(a: A): Array<NonNullable<A>>;
export declare const fromOption: <A>(self: Option.Option<A>): Array<A>;
export declare const fromRecord: <K extends string, A>(self: Readonly<Record<K, A>>): Array<[K, A]>;
export declare const get: (index: number): <A>(self: ReadonlyArray<A>) => Option.Option<A>; // overload 1
export declare const get: <A>(self: ReadonlyArray<A>, index: number): Option.Option<A>; // overload 2
export declare const getFailures: <T extends Iterable<Result.Result<any, any>>>(self: T): Array<Result.Result.Failure<ReadonlyArray.Infer<T>>>;
export declare const getReadonlyReducerConcat: <A>(): Reducer.Reducer<ReadonlyArray<A>>;
export declare const getSomes: <T extends Iterable<Option.Option<X>>, X = any>(self: T): Array<Option.Option.Value<ReadonlyArray.Infer<T>>>;
export declare const getSuccesses: <T extends Iterable<Result.Result<any, any>>>(self: T): Array<Result.Result.Success<ReadonlyArray.Infer<T>>>;
export declare const getUnsafe: (index: number): <A>(self: ReadonlyArray<A>) => A; // overload 1
export declare const getUnsafe: <A>(self: ReadonlyArray<A>, index: number): A; // overload 2
export declare const group: <A>(self: NonEmptyReadonlyArray<A>): NonEmptyArray<NonEmptyArray<A>>;
export declare const groupBy: <A, K extends string | symbol>(f: (a: A) => K): (self: Iterable<A>) => Record<Record.ReadonlyRecord.NonLiteralKey<K>, NonEmptyArray<A>>; // overload 1
export declare const groupBy: <A, K extends string | symbol>(self: Iterable<A>, f: (a: A) => K): Record<Record.ReadonlyRecord.NonLiteralKey<K>, NonEmptyArray<A>>; // overload 2
export declare const groupWith: <A>(isEquivalent: (self: A, that: A) => boolean): (self: NonEmptyReadonlyArray<A>) => NonEmptyArray<NonEmptyArray<A>>; // overload 1
export declare const groupWith: <A>(self: NonEmptyReadonlyArray<A>, isEquivalent: (self: A, that: A) => boolean): NonEmptyArray<NonEmptyArray<A>>; // overload 2
export declare const head: <A>(self: ReadonlyArray<A>): Option.Option<A>;
export declare const headNonEmpty: <A>(self: NonEmptyReadonlyArray<A>): A;
export declare const init: <A>(self: Iterable<A>): Array<A> | undefined;
export declare const initNonEmpty: <A>(self: NonEmptyReadonlyArray<A>): Array<A>;
export declare const insertAt: <B>(i: number, b: B): <A>(self: Iterable<A>) => NonEmptyArray<A | B> | undefined; // overload 1
export declare const insertAt: <A, B>(self: Iterable<A>, i: number, b: B): NonEmptyArray<A | B> | undefined; // overload 2
export declare const intersection: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Array<A & B>; // overload 1
export declare const intersection: <A, B>(self: Iterable<A>, that: Iterable<B>): Array<A & B>; // overload 2
export declare const intersectionWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (that: Iterable<A>): (self: Iterable<A>) => Array<A>; (self: Iterable<A>, that: Iterable<A>): Array<A>; };
export declare const intersperse: <B>(middle: B): <S extends Iterable<any>>(self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S> | B>; // overload 1
export declare const intersperse: <A, B>(self: NonEmptyReadonlyArray<A>, middle: B): NonEmptyArray<A | B>; // overload 2
export declare const intersperse: <A, B>(self: Iterable<A>, middle: B): Array<A | B>; // overload 3
export declare const isArray: (self: unknown): self is Array<unknown>; // overload 1
export declare const isArray: <T>(self: T): self is Extract<T, ReadonlyArray<any>>; // overload 2
export declare const isArrayEmpty: <A>(self: Array<A>): self is [];
export declare const isArrayNonEmpty: <A>(self: Array<A>): self is NonEmptyArray<A>;
export declare const isOutOfBounds: <A>(i: number, as: ReadonlyArray<A>): boolean;
export declare const isReadonlyArrayEmpty: <A>(self: ReadonlyArray<A>): self is readonly [];
export declare const isReadonlyArrayNonEmpty: <A>(self: ReadonlyArray<A>): self is NonEmptyReadonlyArray<A>;
export declare const join: (sep: string): (self: Iterable<string>) => string; // overload 1
export declare const join: (self: Iterable<string>, sep: string): string; // overload 2
export declare const last: <A>(self: ReadonlyArray<A>): Option.Option<A>;
export declare const lastNonEmpty: <A>(self: NonEmptyReadonlyArray<A>): A;
export declare const length: <A>(self: ReadonlyArray<A>): number;
export declare const let: <N extends string, B, A extends object>(tag: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): (self: ReadonlyArray<A>) => Array<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 1
export declare const let: <N extends string, A extends object, B>(self: ReadonlyArray<A>, tag: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): Array<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }>; // overload 2
export declare const liftNullishOr: <A extends Array<unknown>, B>(f: (...a: A) => B): (...a: A) => Array<NonNullable<B>>;
export declare const liftOption: <A extends Array<unknown>, B>(f: (...a: A) => Option.Option<B>): (...a: A) => Array<B>;
export declare const liftPredicate: <A, B extends A>(refinement: Predicate.Refinement<A, B>): (a: A) => Array<B>; // overload 1
export declare const liftPredicate: <A>(predicate: Predicate.Predicate<A>): <B extends A>(b: B) => Array<B>; // overload 2
export declare const liftResult: <A extends Array<unknown>, E, B>(f: (...a: A) => Result.Result<B, E>): (...a: A) => Array<B>;
export declare const make: <Elements extends NonEmptyArray<unknown>>(...elements: Elements): NonEmptyArray<Elements[number]>;
export declare const makeBy: <A>(f: (i: number) => A): (n: number) => NonEmptyArray<A>; // overload 1
export declare const makeBy: <A>(n: number, f: (i: number) => A): NonEmptyArray<A>; // overload 2
export declare const makeEquivalence: <A>(isEquivalent: Equivalence.Equivalence<A>): Equivalence.Equivalence<ReadonlyArray<A>>;
export declare const makeOrder: <A>(O: Order.Order<A>): Order.Order<ReadonlyArray<A>>;
export declare const makeReducerConcat: <A>(): Reducer.Reducer<Array<A>>;
export declare const map: <S extends ReadonlyArray<any>, B>(f: (a: ReadonlyArray.Infer<S>, i: number) => B): (self: S) => ReadonlyArray.With<S, B>; // overload 1
export declare const map: <S extends ReadonlyArray<any>, B>(self: S, f: (a: ReadonlyArray.Infer<S>, i: number) => B): ReadonlyArray.With<S, B>; // overload 2
export declare const mapAccum: <S, A, B, I extends Iterable<A> = Iterable<A>>(s: S, f: (s: S, a: ReadonlyArray.Infer<I>, i: number) => readonly [S, B]): (self: I) => [state: S, mappedArray: ReadonlyArray.With<I, B>]; // overload 1
export declare const mapAccum: <S, A, B, I extends Iterable<A> = Iterable<A>>(self: I, s: S, f: (s: S, a: ReadonlyArray.Infer<I>, i: number) => readonly [S, B]): [state: S, mappedArray: ReadonlyArray.With<I, B>]; // overload 2
export declare const match: <B, A, C = B>(options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (self: NonEmptyReadonlyArray<A>) => C; }): (self: ReadonlyArray<A>) => B | C; // overload 1
export declare const match: <A, B, C = B>(self: ReadonlyArray<A>, options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (self: NonEmptyReadonlyArray<A>) => C; }): B | C; // overload 2
export declare const matchLeft: <B, A, C = B>(options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (head: A, tail: Array<A>) => C; }): (self: ReadonlyArray<A>) => B | C; // overload 1
export declare const matchLeft: <A, B, C = B>(self: ReadonlyArray<A>, options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (head: A, tail: Array<A>) => C; }): B | C; // overload 2
export declare const matchRight: <B, A, C = B>(options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (init: Array<A>, last: A) => C; }): (self: ReadonlyArray<A>) => B | C; // overload 1
export declare const matchRight: <A, B, C = B>(self: ReadonlyArray<A>, options: { readonly onEmpty: LazyArg<B>; readonly onNonEmpty: (init: Array<A>, last: A) => C; }): B | C; // overload 2
export declare const max: <A>(O: Order.Order<A>): (self: NonEmptyReadonlyArray<A>) => A; // overload 1
export declare const max: <A>(self: NonEmptyReadonlyArray<A>, O: Order.Order<A>): A; // overload 2
export declare const min: <A>(O: Order.Order<A>): (self: NonEmptyReadonlyArray<A>) => A; // overload 1
export declare const min: <A>(self: NonEmptyReadonlyArray<A>, O: Order.Order<A>): A; // overload 2
export declare const modify: <A, B, S extends Iterable<A> = Iterable<A>>(i: number, f: (a: ReadonlyArray.Infer<S>) => B): (self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S> | B> | undefined; // overload 1
export declare const modify: <A, B, S extends Iterable<A> = Iterable<A>>(self: S, i: number, f: (a: ReadonlyArray.Infer<S>) => B): ReadonlyArray.With<S, ReadonlyArray.Infer<S> | B> | undefined; // overload 2
export declare const modifyHeadNonEmpty: <A, B>(f: (a: A) => B): (self: NonEmptyReadonlyArray<A>) => NonEmptyArray<A | B>; // overload 1
export declare const modifyHeadNonEmpty: <A, B>(self: NonEmptyReadonlyArray<A>, f: (a: A) => B): NonEmptyArray<A | B>; // overload 2
export declare const modifyLastNonEmpty: <A, B>(f: (a: A) => B): (self: NonEmptyReadonlyArray<A>) => NonEmptyArray<A | B>; // overload 1
export declare const modifyLastNonEmpty: <A, B>(self: NonEmptyReadonlyArray<A>, f: (a: A) => B): NonEmptyArray<A | B>; // overload 2
export declare const of: <A>(a: A): NonEmptyArray<A>;
export declare const pad: <A, T>(n: number, fill: T): (self: Array<A>) => Array<A | T>; // overload 1
export declare const pad: <A, T>(self: Array<A>, n: number, fill: T): Array<A | T>; // overload 2
export declare const partition: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => [excluded: Array<Exclude<A, B>>, satisfying: Array<B>]; // overload 1
export declare const partition: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => [excluded: Array<A>, satisfying: Array<A>]; // overload 2
export declare const partition: <A, Pass, Fail>(f: Filter.Filter<A, Pass, Fail>): (self: Iterable<A>) => [excluded: Array<Fail>, satisfying: Array<Pass>]; // overload 3
export declare const partition: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): [excluded: Array<Exclude<A, B>>, satisfying: Array<B>]; // overload 4
export declare const partition: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): [excluded: Array<A>, satisfying: Array<A>]; // overload 5
export declare const partition: <A, Pass, Fail>(self: Iterable<A>, f: Filter.Filter<A, Pass, Fail>): [excluded: Array<Fail>, satisfying: Array<Pass>]; // overload 6
export declare const partitionMap: <A, B, C>(f: (a: A, i: number) => Result.Result<C, B>): (self: Iterable<A>) => [fails: Array<B>, successes: Array<C>]; // overload 1
export declare const partitionMap: <A, B, C>(self: Iterable<A>, f: (a: A, i: number) => Result.Result<C, B>): [fails: Array<B>, successes: Array<C>]; // overload 2
export declare const prepend: <B>(head: B): <A>(self: Iterable<A>) => NonEmptyArray<A | B>; // overload 1
export declare const prepend: <A, B>(self: Iterable<A>, head: B): NonEmptyArray<A | B>; // overload 2
export declare const prependAll: <S extends Iterable<any>, T extends Iterable<any>>(that: T): (self: S) => ReadonlyArray.OrNonEmpty<S, T, ReadonlyArray.Infer<S> | ReadonlyArray.Infer<T>>; // overload 1
export declare const prependAll: <A, B>(self: Iterable<A>, that: NonEmptyReadonlyArray<B>): NonEmptyArray<A | B>; // overload 2
export declare const prependAll: <A, B>(self: NonEmptyReadonlyArray<A>, that: Iterable<B>): NonEmptyArray<A | B>; // overload 3
export declare const prependAll: <A, B>(self: Iterable<A>, that: Iterable<B>): Array<A | B>; // overload 4
export declare const range: (start: number, end: number): NonEmptyArray<number>;
export declare const reduce: <B, A>(b: B, f: (b: B, a: A, i: number) => B): (self: Iterable<A>) => B; // overload 1
export declare const reduce: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A, i: number) => B): B; // overload 2
export declare const reduceRight: <B, A>(b: B, f: (b: B, a: A, i: number) => B): (self: Iterable<A>) => B; // overload 1
export declare const reduceRight: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A, i: number) => B): B; // overload 2
export declare const remove: (i: number): <A>(self: Iterable<A>) => Array<A>; // overload 1
export declare const remove: <A>(self: Iterable<A>, i: number): Array<A>; // overload 2
export declare const replace: <B>(i: number, b: B): <A, S extends Iterable<A> = Iterable<A>>(self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S> | B> | undefined; // overload 1
export declare const replace: <A, B, S extends Iterable<A> = Iterable<A>>(self: S, i: number, b: B): ReadonlyArray.With<S, ReadonlyArray.Infer<S> | B> | undefined; // overload 2
export declare const replicate: (n: number): <A>(a: A) => NonEmptyArray<A>; // overload 1
export declare const replicate: <A>(a: A, n: number): NonEmptyArray<A>; // overload 2
export declare const reverse: <S extends Iterable<any>>(self: S): S extends NonEmptyReadonlyArray<infer A> ? NonEmptyArray<A> : S extends Iterable<infer A> ? Array<A> : never;
export declare const rotate: (n: number): <S extends Iterable<any>>(self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S>>; // overload 1
export declare const rotate: <A>(self: NonEmptyReadonlyArray<A>, n: number): NonEmptyArray<A>; // overload 2
export declare const rotate: <A>(self: Iterable<A>, n: number): Array<A>; // overload 3
export declare const scan: <B, A>(b: B, f: (b: B, a: A) => B): (self: Iterable<A>) => NonEmptyArray<B>; // overload 1
export declare const scan: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A) => B): NonEmptyArray<B>; // overload 2
export declare const scanRight: <B, A>(b: B, f: (b: B, a: A) => B): (self: Iterable<A>) => NonEmptyArray<B>; // overload 1
export declare const scanRight: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A) => B): NonEmptyArray<B>; // overload 2
export declare const separate: <T extends Iterable<Result.Result<any, any>>>(self: T): [failures: Array<Result.Result.Failure<ReadonlyArray.Infer<T>>>, successes: Array<Result.Result.Success<ReadonlyArray.Infer<T>>>];
export declare const setHeadNonEmpty: <B>(b: B): <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyArray<A | B>; // overload 1
export declare const setHeadNonEmpty: <A, B>(self: NonEmptyReadonlyArray<A>, b: B): NonEmptyArray<A | B>; // overload 2
export declare const setLastNonEmpty: <B>(b: B): <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyArray<A | B>; // overload 1
export declare const setLastNonEmpty: <A, B>(self: NonEmptyReadonlyArray<A>, b: B): NonEmptyArray<A | B>; // overload 2
export declare const some: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: ReadonlyArray<A>) => self is NonEmptyReadonlyArray<A>; // overload 1
export declare const some: <A>(self: ReadonlyArray<A>, predicate: (a: A, i: number) => boolean): self is NonEmptyReadonlyArray<A>; // overload 2
export declare const sort: <B>(O: Order.Order<B>): <A extends B, S extends Iterable<A>>(self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S>>; // overload 1
export declare const sort: <A extends B, B>(self: NonEmptyReadonlyArray<A>, O: Order.Order<B>): NonEmptyArray<A>; // overload 2
export declare const sort: <A extends B, B>(self: Iterable<A>, O: Order.Order<B>): Array<A>; // overload 3
export declare const sortBy: <S extends Iterable<any>>(...orders: ReadonlyArray<Order.Order<ReadonlyArray.Infer<S>>>): (self: S) => S extends NonEmptyReadonlyArray<infer A> ? NonEmptyArray<A> : S extends Iterable<infer A> ? Array<A> : never;
export declare const sortWith: <S extends Iterable<any>, B>(f: (a: ReadonlyArray.Infer<S>) => B, order: Order.Order<B>): (self: S) => ReadonlyArray.With<S, ReadonlyArray.Infer<S>>; // overload 1
export declare const sortWith: <A, B>(self: NonEmptyReadonlyArray<A>, f: (a: A) => B, O: Order.Order<B>): NonEmptyArray<A>; // overload 2
export declare const sortWith: <A, B>(self: Iterable<A>, f: (a: A) => B, order: Order.Order<B>): Array<A>; // overload 3
export declare const span: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => [init: Array<B>, rest: Array<Exclude<A, B>>]; // overload 1
export declare const span: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => [init: Array<A>, rest: Array<A>]; // overload 2
export declare const span: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): [init: Array<B>, rest: Array<Exclude<A, B>>]; // overload 3
export declare const span: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): [init: Array<A>, rest: Array<A>]; // overload 4
export declare const split: (n: number): <A>(self: Iterable<A>) => Array<Array<A>>; // overload 1
export declare const split: <A>(self: Iterable<A>, n: number): Array<Array<A>>; // overload 2
export declare const splitAt: (n: number): <A>(self: Iterable<A>) => [beforeIndex: Array<A>, fromIndex: Array<A>]; // overload 1
export declare const splitAt: <A>(self: Iterable<A>, n: number): [beforeIndex: Array<A>, fromIndex: Array<A>]; // overload 2
export declare const splitAtNonEmpty: (n: number): <A>(self: NonEmptyReadonlyArray<A>) => [beforeIndex: NonEmptyArray<A>, fromIndex: Array<A>]; // overload 1
export declare const splitAtNonEmpty: <A>(self: NonEmptyReadonlyArray<A>, n: number): [beforeIndex: NonEmptyArray<A>, fromIndex: Array<A>]; // overload 2
export declare const splitWhere: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => [beforeMatch: Array<A>, fromMatch: Array<A>]; // overload 1
export declare const splitWhere: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): [beforeMatch: Array<A>, fromMatch: Array<A>]; // overload 2
export declare const tail: <A>(self: Iterable<A>): Array<A> | undefined;
export declare const tailNonEmpty: <A>(self: NonEmptyReadonlyArray<A>): Array<A>;
export declare const take: (n: number): <A>(self: Iterable<A>) => Array<A>; // overload 1
export declare const take: <A>(self: Iterable<A>, n: number): Array<A>; // overload 2
export declare const takeRight: (n: number): <A>(self: Iterable<A>) => Array<A>; // overload 1
export declare const takeRight: <A>(self: Iterable<A>, n: number): Array<A>; // overload 2
export declare const takeWhile: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Array<B>; // overload 1
export declare const takeWhile: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Array<A>; // overload 2
export declare const takeWhile: <A, B, X>(f: Filter.Filter<NoInfer<A>, B, X>): (self: Iterable<A>) => Array<B>; // overload 3
export declare const takeWhile: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Array<B>; // overload 4
export declare const takeWhile: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Array<A>; // overload 5
export declare const takeWhile: <A, B, X>(self: Iterable<A>, f: Filter.Filter<A, B, X>): Array<B>; // overload 6
export declare const unappend: <A>(self: NonEmptyReadonlyArray<A>): [arrayWithoutLastElement: Array<A>, lastElement: A];
export declare const unfold: <B, A>(b: B, f: (b: B) => readonly [A, B] | undefined): Array<A>;
export declare const union: <T extends Iterable<any>>(that: T): <S extends Iterable<any>>(self: S) => ReadonlyArray.OrNonEmpty<S, T, ReadonlyArray.Infer<S> | ReadonlyArray.Infer<T>>; // overload 1
export declare const union: <A, B>(self: NonEmptyReadonlyArray<A>, that: ReadonlyArray<B>): NonEmptyArray<A | B>; // overload 2
export declare const union: <A, B>(self: ReadonlyArray<A>, that: NonEmptyReadonlyArray<B>): NonEmptyArray<A | B>; // overload 3
export declare const union: <A, B>(self: Iterable<A>, that: Iterable<B>): Array<A | B>; // overload 4
export declare const unionWith: <S extends Iterable<any>, T extends Iterable<any>>(that: T, isEquivalent: (self: ReadonlyArray.Infer<S>, that: ReadonlyArray.Infer<T>) => boolean): (self: S) => ReadonlyArray.OrNonEmpty<S, T, ReadonlyArray.Infer<S> | ReadonlyArray.Infer<T>>; // overload 1
export declare const unionWith: <A, B>(self: NonEmptyReadonlyArray<A>, that: Iterable<B>, isEquivalent: (self: A, that: B) => boolean): NonEmptyArray<A | B>; // overload 2
export declare const unionWith: <A, B>(self: Iterable<A>, that: NonEmptyReadonlyArray<B>, isEquivalent: (self: A, that: B) => boolean): NonEmptyArray<A | B>; // overload 3
export declare const unionWith: <A, B>(self: Iterable<A>, that: Iterable<B>, isEquivalent: (self: A, that: B) => boolean): Array<A | B>; // overload 4
export declare const unprepend: <A>(self: NonEmptyReadonlyArray<A>): [firstElement: A, remainingElements: Array<A>];
export declare const unzip: <S extends Iterable<readonly [any, any]>>(self: S): S extends NonEmptyReadonlyArray<readonly [infer A, infer B]> ? [NonEmptyArray<A>, NonEmptyArray<B>] : S extends Iterable<readonly [infer A, infer B]> ? [Array<A>, Array<B>] : never;
export declare const window: <N extends number>(n: N): <A>(self: Iterable<A>) => Array<TupleOf<N, A>>; // overload 1
export declare const window: <A, N extends number>(self: Iterable<A>, n: N): Array<TupleOf<N, A>>; // overload 2
export declare const zip: <B>(that: NonEmptyReadonlyArray<B>): <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyArray<[A, B]>; // overload 1
export declare const zip: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Array<[A, B]>; // overload 2
export declare const zip: <A, B>(self: NonEmptyReadonlyArray<A>, that: NonEmptyReadonlyArray<B>): NonEmptyArray<[A, B]>; // overload 3
export declare const zip: <A, B>(self: Iterable<A>, that: Iterable<B>): Array<[A, B]>; // overload 4
export declare const zipWith: <B, A, C>(that: NonEmptyReadonlyArray<B>, f: (a: A, b: B) => C): (self: NonEmptyReadonlyArray<A>) => NonEmptyArray<C>; // overload 1
export declare const zipWith: <B, A, C>(that: Iterable<B>, f: (a: A, b: B) => C): (self: Iterable<A>) => Array<C>; // overload 2
export declare const zipWith: <A, B, C>(self: NonEmptyReadonlyArray<A>, that: NonEmptyReadonlyArray<B>, f: (a: A, b: B) => C): NonEmptyArray<C>; // overload 3
export declare const zipWith: <B, A, C>(self: Iterable<A>, that: Iterable<B>, f: (a: A, b: B) => C): Array<C>; // overload 4
```

## Other Exports (Non-Function)

- `Do` (variable)
- `NonEmptyArray` (type)
- `NonEmptyReadonlyArray` (type)
- `ReadonlyArray` (namespace)
- `ReadonlyArrayTypeLambda` (interface)
