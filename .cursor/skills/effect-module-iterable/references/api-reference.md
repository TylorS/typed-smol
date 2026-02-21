# API Reference: effect/Iterable

- Import path: `effect/Iterable`
- Source file: `packages/effect/src/Iterable.ts`
- Function exports (callable): 50
- Non-function exports: 0

## Purpose

This module provides utility functions for working with Iterables in TypeScript.

## Key Function Exports

- `append`
- `appendAll`
- `cartesian`
- `cartesianWith`
- `chunksOf`
- `contains`
- `containsWith`
- `countBy`
- `dedupeAdjacent`
- `dedupeAdjacentWith`
- `drop`
- `empty`
- `filter`
- `filterMap`
- `filterMapWhile`
- `findFirst`
- `findLast`
- `flatMap`

## All Function Signatures

```ts
export declare const append: <B>(last: B): <A>(self: Iterable<A>) => Iterable<A | B>; // overload 1
export declare const append: <A, B>(self: Iterable<A>, last: B): Iterable<A | B>; // overload 2
export declare const appendAll: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Iterable<A | B>; // overload 1
export declare const appendAll: <A, B>(self: Iterable<A>, that: Iterable<B>): Iterable<A | B>; // overload 2
export declare const cartesian: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Iterable<[A, B]>; // overload 1
export declare const cartesian: <A, B>(self: Iterable<A>, that: Iterable<B>): Iterable<[A, B]>; // overload 2
export declare const cartesianWith: <A, B, C>(that: Iterable<B>, f: (a: A, b: B) => C): (self: Iterable<A>) => Iterable<C>; // overload 1
export declare const cartesianWith: <A, B, C>(self: Iterable<A>, that: Iterable<B>, f: (a: A, b: B) => C): Iterable<C>; // overload 2
export declare const chunksOf: (n: number): <A>(self: Iterable<A>) => Iterable<Array<A>>; // overload 1
export declare const chunksOf: <A>(self: Iterable<A>, n: number): Iterable<Array<A>>; // overload 2
export declare const contains: <A>(a: A): (self: Iterable<A>) => boolean; // overload 1
export declare const contains: <A>(self: Iterable<A>, a: A): boolean; // overload 2
export declare const containsWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (a: A): (self: Iterable<A>) => boolean; (self: Iterable<A>, a: A): boolean; };
export declare const countBy: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => number; // overload 1
export declare const countBy: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): number; // overload 2
export declare const dedupeAdjacent: <A>(self: Iterable<A>): Iterable<A>;
export declare const dedupeAdjacentWith: <A>(isEquivalent: (self: A, that: A) => boolean): (self: Iterable<A>) => Iterable<A>; // overload 1
export declare const dedupeAdjacentWith: <A>(self: Iterable<A>, isEquivalent: (self: A, that: A) => boolean): Iterable<A>; // overload 2
export declare const drop: (n: number): <A>(self: Iterable<A>) => Iterable<A>; // overload 1
export declare const drop: <A>(self: Iterable<A>, n: number): Iterable<A>; // overload 2
export declare const empty: <A = never>(): Iterable<A>;
export declare const filter: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const filter: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Iterable<A>; // overload 2
export declare const filter: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Iterable<B>; // overload 3
export declare const filter: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Iterable<A>; // overload 4
export declare const filterMap: <A, B>(f: (a: A, i: number) => Option<B>): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const filterMap: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option<B>): Iterable<B>; // overload 2
export declare const filterMapWhile: <A, B>(f: (a: A, i: number) => Option<B>): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const filterMapWhile: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option<B>): Iterable<B>; // overload 2
export declare const findFirst: <A, B>(f: (a: NoInfer<A>, i: number) => Option<B>): (self: Iterable<A>) => Option<B>; // overload 1
export declare const findFirst: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Option<B>; // overload 2
export declare const findFirst: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Option<A>; // overload 3
export declare const findFirst: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option<B>): Option<B>; // overload 4
export declare const findFirst: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Option<B>; // overload 5
export declare const findFirst: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Option<A>; // overload 6
export declare const findLast: <A, B>(f: (a: NoInfer<A>, i: number) => Option<B>): (self: Iterable<A>) => Option<B>; // overload 1
export declare const findLast: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Option<B>; // overload 2
export declare const findLast: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Option<A>; // overload 3
export declare const findLast: <A, B>(self: Iterable<A>, f: (a: A, i: number) => Option<B>): Option<B>; // overload 4
export declare const findLast: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Option<B>; // overload 5
export declare const findLast: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Option<A>; // overload 6
export declare const flatMap: <A, B>(f: (a: NoInfer<A>, i: number) => Iterable<B>): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const flatMap: <A, B>(self: Iterable<A>, f: (a: NoInfer<A>, i: number) => Iterable<B>): Iterable<B>; // overload 2
export declare const flatMapNullishOr: <A, B>(f: (a: A) => B): (self: Iterable<A>) => Iterable<NonNullable<B>>; // overload 1
export declare const flatMapNullishOr: <A, B>(self: Iterable<A>, f: (a: A) => B): Iterable<NonNullable<B>>; // overload 2
export declare const flatten: <A>(self: Iterable<Iterable<A>>): Iterable<A>;
export declare const forEach: <A>(f: (a: A, i: number) => void): (self: Iterable<A>) => void; // overload 1
export declare const forEach: <A>(self: Iterable<A>, f: (a: A, i: number) => void): void; // overload 2
export declare const forever: <A>(self: Iterable<A>): Iterable<A>;
export declare const fromRecord: <K extends string, A>(self: Readonly<Record<K, A>>): Iterable<[K, A]>;
export declare const getFailures: <R, L>(self: Iterable<Result<R, L>>): Iterable<L>;
export declare const getSomes: <A>(self: Iterable<Option<A>>): Iterable<A>;
export declare const getSuccesses: <R, L>(self: Iterable<Result<R, L>>): Iterable<R>;
export declare const group: <A>(self: Iterable<A>): Iterable<NonEmptyArray<A>>;
export declare const groupBy: <A, K extends string | symbol>(f: (a: A) => K): (self: Iterable<A>) => Record<Record.ReadonlyRecord.NonLiteralKey<K>, NonEmptyArray<A>>; // overload 1
export declare const groupBy: <A, K extends string | symbol>(self: Iterable<A>, f: (a: A) => K): Record<Record.ReadonlyRecord.NonLiteralKey<K>, NonEmptyArray<A>>; // overload 2
export declare const groupWith: <A>(isEquivalent: (self: A, that: A) => boolean): (self: Iterable<A>) => Iterable<NonEmptyArray<A>>; // overload 1
export declare const groupWith: <A>(self: Iterable<A>, isEquivalent: (self: A, that: A) => boolean): Iterable<NonEmptyArray<A>>; // overload 2
export declare const head: <A>(self: Iterable<A>): Option<A>;
export declare const headUnsafe: <A>(self: Iterable<A>): A;
export declare const intersperse: <B>(middle: B): <A>(self: Iterable<A>) => Iterable<A | B>; // overload 1
export declare const intersperse: <A, B>(self: Iterable<A>, middle: B): Iterable<A | B>; // overload 2
export declare const isEmpty: <A>(self: Iterable<A>): self is Iterable<never>;
export declare const makeBy: <A>(f: (i: number) => A, options?: { readonly length?: number; }): Iterable<A>;
export declare const map: <A, B>(f: (a: NoInfer<A>, i: number) => B): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const map: <A, B>(self: Iterable<A>, f: (a: NoInfer<A>, i: number) => B): Iterable<B>; // overload 2
export declare const of: <A>(a: A): Iterable<A>;
export declare const prepend: <B>(head: B): <A>(self: Iterable<A>) => Iterable<A | B>; // overload 1
export declare const prepend: <A, B>(self: Iterable<A>, head: B): Iterable<A | B>; // overload 2
export declare const prependAll: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Iterable<A | B>; // overload 1
export declare const prependAll: <A, B>(self: Iterable<A>, that: Iterable<B>): Iterable<A | B>; // overload 2
export declare const range: (start: number, end?: number): Iterable<number>;
export declare const reduce: <B, A>(b: B, f: (b: B, a: A, i: number) => B): (self: Iterable<A>) => B; // overload 1
export declare const reduce: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A, i: number) => B): B; // overload 2
export declare const repeat: (n: number): <A>(self: Iterable<A>) => Iterable<A>; // overload 1
export declare const repeat: <A>(self: Iterable<A>, n: number): Iterable<A>; // overload 2
export declare const replicate: (n: number): <A>(a: A) => Iterable<A>; // overload 1
export declare const replicate: <A>(a: A, n: number): Iterable<A>; // overload 2
export declare const scan: <B, A>(b: B, f: (b: B, a: A) => B): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const scan: <A, B>(self: Iterable<A>, b: B, f: (b: B, a: A) => B): Iterable<B>; // overload 2
export declare const size: <A>(self: Iterable<A>): number;
export declare const some: <A>(predicate: (a: A, i: number) => boolean): (self: Iterable<A>) => boolean; // overload 1
export declare const some: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): boolean; // overload 2
export declare const take: (n: number): <A>(self: Iterable<A>) => Iterable<A>; // overload 1
export declare const take: <A>(self: Iterable<A>, n: number): Iterable<A>; // overload 2
export declare const takeWhile: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Iterable<A>) => Iterable<B>; // overload 1
export declare const takeWhile: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Iterable<A>) => Iterable<A>; // overload 2
export declare const takeWhile: <A, B extends A>(self: Iterable<A>, refinement: (a: A, i: number) => a is B): Iterable<B>; // overload 3
export declare const takeWhile: <A>(self: Iterable<A>, predicate: (a: A, i: number) => boolean): Iterable<A>; // overload 4
export declare const unfold: <B, A>(b: B, f: (b: B) => readonly [A, B] | undefined): Iterable<A>;
export declare const zip: <B>(that: Iterable<B>): <A>(self: Iterable<A>) => Iterable<[A, B]>; // overload 1
export declare const zip: <A, B>(self: Iterable<A>, that: Iterable<B>): Iterable<[A, B]>; // overload 2
export declare const zipWith: <B, A, C>(that: Iterable<B>, f: (a: A, b: B) => C): (self: Iterable<A>) => Iterable<C>; // overload 1
export declare const zipWith: <A, B, C>(self: Iterable<A>, that: Iterable<B>, f: (a: A, b: B) => C): Iterable<C>; // overload 2
```

## Other Exports (Non-Function)

- None
