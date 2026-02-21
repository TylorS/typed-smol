# API Reference: effect/Chunk

- Import path: `effect/Chunk`
- Source file: `packages/effect/src/Chunk.ts`
- Function exports (callable): 78
- Non-function exports: 3

## Purpose

The `Chunk` module provides an immutable, high-performance sequence data structure optimized for functional programming patterns. A `Chunk` is a persistent data structure that supports efficient append, prepend, and concatenation operations.

## Key Function Exports

- `append`
- `appendAll`
- `chunksOf`
- `compact`
- `contains`
- `containsWith`
- `dedupe`
- `dedupeAdjacent`
- `difference`
- `differenceWith`
- `drop`
- `dropRight`
- `dropWhile`
- `empty`
- `every`
- `filter`
- `filterMap`
- `filterMapWhile`

## All Function Signatures

```ts
export declare const append: <A2>(a: A2): <A>(self: Chunk<A>) => NonEmptyChunk<A2 | A>; // overload 1
export declare const append: <A, A2>(self: Chunk<A>, a: A2): NonEmptyChunk<A | A2>; // overload 2
export declare const appendAll: <S extends Chunk<any>, T extends Chunk<any>>(that: T): (self: S) => Chunk.OrNonEmpty<S, T, Chunk.Infer<S> | Chunk.Infer<T>>; // overload 1
export declare const appendAll: <A, B>(self: Chunk<A>, that: NonEmptyChunk<B>): NonEmptyChunk<A | B>; // overload 2
export declare const appendAll: <A, B>(self: NonEmptyChunk<A>, that: Chunk<B>): NonEmptyChunk<A | B>; // overload 3
export declare const appendAll: <A, B>(self: Chunk<A>, that: Chunk<B>): Chunk<A | B>; // overload 4
export declare const chunksOf: (n: number): <A>(self: Chunk<A>) => Chunk<Chunk<A>>; // overload 1
export declare const chunksOf: <A>(self: Chunk<A>, n: number): Chunk<Chunk<A>>; // overload 2
export declare const compact: <A>(self: Chunk<Option<A>>): Chunk<A>;
export declare const contains: <A>(a: A): (self: Chunk<A>) => boolean; // overload 1
export declare const contains: <A>(self: Chunk<A>, a: A): boolean; // overload 2
export declare const containsWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (a: A): (self: Chunk<A>) => boolean; (self: Chunk<A>, a: A): boolean; };
export declare const dedupe: <A>(self: Chunk<A>): Chunk<A>;
export declare const dedupeAdjacent: <A>(self: Chunk<A>): Chunk<A>;
export declare const difference: <A>(that: Chunk<A>): (self: Chunk<A>) => Chunk<A>; // overload 1
export declare const difference: <A>(self: Chunk<A>, that: Chunk<A>): Chunk<A>; // overload 2
export declare const differenceWith: <A>(isEquivalent: (self: A, that: A) => boolean): { (that: Chunk<A>): (self: Chunk<A>) => Chunk<A>; (self: Chunk<A>, that: Chunk<A>): Chunk<A>; };
export declare const drop: (n: number): <A>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const drop: <A>(self: Chunk<A>, n: number): Chunk<A>; // overload 2
export declare const dropRight: (n: number): <A>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const dropRight: <A>(self: Chunk<A>, n: number): Chunk<A>; // overload 2
export declare const dropWhile: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => Chunk<A>; // overload 1
export declare const dropWhile: <A>(self: Chunk<A>, predicate: Predicate<A>): Chunk<A>; // overload 2
export declare const empty: <A = never>(): Chunk<A>;
export declare const every: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Chunk<A>) => self is Chunk<B>; // overload 1
export declare const every: <A>(predicate: Predicate<A>): (self: Chunk<A>) => boolean; // overload 2
export declare const every: <A, B extends A>(self: Chunk<A>, refinement: Refinement<A, B>): self is Chunk<B>; // overload 3
export declare const every: <A>(self: Chunk<A>, predicate: Predicate<A>): boolean; // overload 4
export declare const filter: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Chunk<A>) => Chunk<B>; // overload 1
export declare const filter: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => Chunk<A>; // overload 2
export declare const filter: <A, B extends A>(self: Chunk<A>, refinement: Refinement<A, B>): Chunk<B>; // overload 3
export declare const filter: <A>(self: Chunk<A>, predicate: Predicate<A>): Chunk<A>; // overload 4
export declare const filterMap: <A, B>(f: (a: A, i: number) => Option<B>): (self: Chunk<A>) => Chunk<B>; // overload 1
export declare const filterMap: <A, B>(self: Chunk<A>, f: (a: A, i: number) => Option<B>): Chunk<B>; // overload 2
export declare const filterMapWhile: <A, B>(f: (a: A) => Option<B>): (self: Chunk<A>) => Chunk<B>; // overload 1
export declare const filterMapWhile: <A, B>(self: Chunk<A>, f: (a: A) => Option<B>): Chunk<B>; // overload 2
export declare const findFirst: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Chunk<A>) => Option<B>; // overload 1
export declare const findFirst: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => Option<A>; // overload 2
export declare const findFirst: <A, B extends A>(self: Chunk<A>, refinement: Refinement<A, B>): Option<B>; // overload 3
export declare const findFirst: <A>(self: Chunk<A>, predicate: Predicate<A>): Option<A>; // overload 4
export declare const findFirstIndex: <A>(predicate: Predicate<A>): (self: Chunk<A>) => number | undefined; // overload 1
export declare const findFirstIndex: <A>(self: Chunk<A>, predicate: Predicate<A>): number | undefined; // overload 2
export declare const findLast: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Chunk<A>) => Option<B>; // overload 1
export declare const findLast: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => Option<A>; // overload 2
export declare const findLast: <A, B extends A>(self: Chunk<A>, refinement: Refinement<A, B>): Option<B>; // overload 3
export declare const findLast: <A>(self: Chunk<A>, predicate: Predicate<A>): Option<A>; // overload 4
export declare const findLastIndex: <A>(predicate: Predicate<A>): (self: Chunk<A>) => number | undefined; // overload 1
export declare const findLastIndex: <A>(self: Chunk<A>, predicate: Predicate<A>): number | undefined; // overload 2
export declare const flatMap: <S extends Chunk<any>, T extends Chunk<any>>(f: (a: Chunk.Infer<S>, i: number) => T): (self: S) => Chunk.AndNonEmpty<S, T, Chunk.Infer<T>>; // overload 1
export declare const flatMap: <A, B>(self: NonEmptyChunk<A>, f: (a: A, i: number) => NonEmptyChunk<B>): NonEmptyChunk<B>; // overload 2
export declare const flatMap: <A, B>(self: Chunk<A>, f: (a: A, i: number) => Chunk<B>): Chunk<B>; // overload 3
export declare const flatten: <S extends Chunk<Chunk<any>>>(self: S): Chunk.Flatten<S>;
export declare const forEach: <A, B>(f: (a: A, index: number) => B): (self: Chunk<A>) => void; // overload 1
export declare const forEach: <A, B>(self: Chunk<A>, f: (a: A, index: number) => B): void; // overload 2
export declare const fromArrayUnsafe: <A>(self: ReadonlyArray<A>): Chunk<A>;
export declare const fromIterable: <A>(self: Iterable<A>): Chunk<A>;
export declare const fromNonEmptyArrayUnsafe: <A>(self: NonEmptyReadonlyArray<A>): NonEmptyChunk<A>;
export declare const get: (index: number): <A>(self: Chunk<A>) => Option<A>; // overload 1
export declare const get: <A>(self: Chunk<A>, index: number): Option<A>; // overload 2
export declare const getUnsafe: (index: number): <A>(self: Chunk<A>) => A; // overload 1
export declare const getUnsafe: <A>(self: Chunk<A>, index: number): A; // overload 2
export declare const head: <A>(self: Chunk<A>): Option<A>;
export declare const headNonEmpty: <A>(self: NonEmptyChunk<A>): A;
export declare const headUnsafe: <A>(self: Chunk<A>): A;
export declare const intersection: <A>(that: Chunk<A>): <B>(self: Chunk<B>) => Chunk<A & B>; // overload 1
export declare const intersection: <A, B>(self: Chunk<A>, that: Chunk<B>): Chunk<A & B>; // overload 2
export declare const isChunk: <A>(u: Iterable<A>): u is Chunk<A>; // overload 1
export declare const isChunk: (u: unknown): u is Chunk<unknown>; // overload 2
export declare const isEmpty: <A>(self: Chunk<A>): boolean;
export declare const isNonEmpty: <A>(self: Chunk<A>): self is NonEmptyChunk<A>;
export declare const join: (sep: string): (self: Chunk<string>) => string; // overload 1
export declare const join: (self: Chunk<string>, sep: string): string; // overload 2
export declare const last: <A>(self: Chunk<A>): Option<A>;
export declare const lastNonEmpty: <A>(self: NonEmptyChunk<A>): A;
export declare const lastUnsafe: <A>(self: Chunk<A>): A;
export declare const make: <As extends readonly [any, ...Array<any>]>(...as: As): NonEmptyChunk<As[number]>;
export declare const makeBy: <A>(f: (i: number) => A): (n: number) => NonEmptyChunk<A>; // overload 1
export declare const makeBy: <A>(n: number, f: (i: number) => A): NonEmptyChunk<A>; // overload 2
export declare const makeEquivalence: <A>(isEquivalent: Equivalence.Equivalence<A>): Equivalence.Equivalence<Chunk<A>>;
export declare const map: <S extends Chunk<any>, B>(f: (a: Chunk.Infer<S>, i: number) => B): (self: S) => Chunk.With<S, B>; // overload 1
export declare const map: <A, B>(self: NonEmptyChunk<A>, f: (a: A, i: number) => B): NonEmptyChunk<B>; // overload 2
export declare const map: <A, B>(self: Chunk<A>, f: (a: A, i: number) => B): Chunk<B>; // overload 3
export declare const mapAccum: <S, A, B>(s: S, f: (s: S, a: A) => readonly [S, B]): (self: Chunk<A>) => [S, Chunk<B>]; // overload 1
export declare const mapAccum: <S, A, B>(self: Chunk<A>, s: S, f: (s: S, a: A) => readonly [S, B]): [S, Chunk<B>]; // overload 2
export declare const modify: <A, B>(i: number, f: (a: A) => B): (self: Chunk<A>) => Chunk<A | B> | undefined; // overload 1
export declare const modify: <A, B>(self: Chunk<A>, i: number, f: (a: A) => B): Chunk<A | B> | undefined; // overload 2
export declare const of: <A>(a: A): NonEmptyChunk<A>;
export declare const partition: <A, B extends A>(refinement: (a: NoInfer<A>, i: number) => a is B): (self: Chunk<A>) => [excluded: Chunk<Exclude<A, B>>, satisfying: Chunk<B>]; // overload 1
export declare const partition: <A>(predicate: (a: NoInfer<A>, i: number) => boolean): (self: Chunk<A>) => [excluded: Chunk<A>, satisfying: Chunk<A>]; // overload 2
export declare const partition: <A, B extends A>(self: Chunk<A>, refinement: (a: A, i: number) => a is B): [excluded: Chunk<Exclude<A, B>>, satisfying: Chunk<B>]; // overload 3
export declare const partition: <A>(self: Chunk<A>, predicate: (a: A, i: number) => boolean): [excluded: Chunk<A>, satisfying: Chunk<A>]; // overload 4
export declare const partitionMap: <A, B, C>(f: (a: A) => Result<C, B>): (self: Chunk<A>) => [left: Chunk<B>, right: Chunk<C>]; // overload 1
export declare const partitionMap: <A, B, C>(self: Chunk<A>, f: (a: A) => Result<C, B>): [left: Chunk<B>, right: Chunk<C>]; // overload 2
export declare const prepend: <B>(elem: B): <A>(self: Chunk<A>) => NonEmptyChunk<B | A>; // overload 1
export declare const prepend: <A, B>(self: Chunk<A>, elem: B): NonEmptyChunk<A | B>; // overload 2
export declare const prependAll: <S extends Chunk<any>, T extends Chunk<any>>(that: T): (self: S) => Chunk.OrNonEmpty<S, T, Chunk.Infer<S> | Chunk.Infer<T>>; // overload 1
export declare const prependAll: <A, B>(self: Chunk<A>, that: NonEmptyChunk<B>): NonEmptyChunk<A | B>; // overload 2
export declare const prependAll: <A, B>(self: NonEmptyChunk<A>, that: Chunk<B>): NonEmptyChunk<A | B>; // overload 3
export declare const prependAll: <A, B>(self: Chunk<A>, that: Chunk<B>): Chunk<A | B>; // overload 4
export declare const range: (start: number, end: number): NonEmptyChunk<number>;
export declare const reduce: <B, A>(b: B, f: (b: B, a: A, i: number) => B): (self: Chunk<A>) => B; // overload 1
export declare const reduce: <A, B>(self: Chunk<A>, b: B, f: (b: B, a: A, i: number) => B): B; // overload 2
export declare const reduceRight: <B, A>(b: B, f: (b: B, a: A, i: number) => B): (self: Chunk<A>) => B; // overload 1
export declare const reduceRight: <A, B>(self: Chunk<A>, b: B, f: (b: B, a: A, i: number) => B): B; // overload 2
export declare const remove: (i: number): <A>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const remove: <A>(self: Chunk<A>, i: number): Chunk<A>; // overload 2
export declare const replace: <B>(i: number, b: B): <A>(self: Chunk<A>) => Chunk<B | A> | undefined; // overload 1
export declare const replace: <A, B>(self: Chunk<A>, i: number, b: B): Chunk<B | A> | undefined; // overload 2
export declare const reverse: <S extends Chunk<any>>(self: S): Chunk.With<S, Chunk.Infer<S>>;
export declare const separate: <A, B>(self: Chunk<Result<B, A>>): [Chunk<A>, Chunk<B>];
export declare const size: <A>(self: Chunk<A>): number;
export declare const some: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => self is NonEmptyChunk<A>; // overload 1
export declare const some: <A>(self: Chunk<A>, predicate: Predicate<A>): self is NonEmptyChunk<A>; // overload 2
export declare const sort: <B>(O: Order.Order<B>): <A extends B>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const sort: <A extends B, B>(self: Chunk<A>, O: Order.Order<B>): Chunk<A>; // overload 2
export declare const sortWith: <A, B>(f: (a: A) => B, order: Order.Order<B>): (self: Chunk<A>) => Chunk<A>; // overload 1
export declare const sortWith: <A, B>(self: Chunk<A>, f: (a: A) => B, order: Order.Order<B>): Chunk<A>; // overload 2
export declare const split: (n: number): <A>(self: Chunk<A>) => Chunk<Chunk<A>>; // overload 1
export declare const split: <A>(self: Chunk<A>, n: number): Chunk<Chunk<A>>; // overload 2
export declare const splitAt: (n: number): <A>(self: Chunk<A>) => [beforeIndex: Chunk<A>, fromIndex: Chunk<A>]; // overload 1
export declare const splitAt: <A>(self: Chunk<A>, n: number): [beforeIndex: Chunk<A>, fromIndex: Chunk<A>]; // overload 2
export declare const splitNonEmptyAt: (n: number): <A>(self: NonEmptyChunk<A>) => [beforeIndex: NonEmptyChunk<A>, fromIndex: Chunk<A>]; // overload 1
export declare const splitNonEmptyAt: <A>(self: NonEmptyChunk<A>, n: number): [beforeIndex: NonEmptyChunk<A>, fromIndex: Chunk<A>]; // overload 2
export declare const splitWhere: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => [beforeMatch: Chunk<A>, fromMatch: Chunk<A>]; // overload 1
export declare const splitWhere: <A>(self: Chunk<A>, predicate: Predicate<A>): [beforeMatch: Chunk<A>, fromMatch: Chunk<A>]; // overload 2
export declare const tail: <A>(self: Chunk<A>): Chunk<A> | undefined;
export declare const tailNonEmpty: <A>(self: NonEmptyChunk<A>): Chunk<A>;
export declare const take: (n: number): <A>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const take: <A>(self: Chunk<A>, n: number): Chunk<A>; // overload 2
export declare const takeRight: (n: number): <A>(self: Chunk<A>) => Chunk<A>; // overload 1
export declare const takeRight: <A>(self: Chunk<A>, n: number): Chunk<A>; // overload 2
export declare const takeWhile: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): (self: Chunk<A>) => Chunk<B>; // overload 1
export declare const takeWhile: <A>(predicate: Predicate<NoInfer<A>>): (self: Chunk<A>) => Chunk<A>; // overload 2
export declare const takeWhile: <A, B extends A>(self: Chunk<A>, refinement: Refinement<A, B>): Chunk<B>; // overload 3
export declare const takeWhile: <A>(self: Chunk<A>, predicate: Predicate<A>): Chunk<A>; // overload 4
export declare const toArray: <S extends Chunk<any>>(self: S): S extends NonEmptyChunk<any> ? RA.NonEmptyArray<Chunk.Infer<S>> : Array<Chunk.Infer<S>>;
export declare const toReadonlyArray: <S extends Chunk<any>>(self: S): S extends NonEmptyChunk<any> ? RA.NonEmptyReadonlyArray<Chunk.Infer<S>> : ReadonlyArray<Chunk.Infer<S>>;
export declare const union: <A>(that: Chunk<A>): <B>(self: Chunk<B>) => Chunk<A | B>; // overload 1
export declare const union: <A, B>(self: Chunk<A>, that: Chunk<B>): Chunk<A | B>; // overload 2
export declare const unzip: <A, B>(self: Chunk<readonly [A, B]>): [Chunk<A>, Chunk<B>];
export declare const zip: <B>(that: Chunk<B>): <A>(self: Chunk<A>) => Chunk<[A, B]>; // overload 1
export declare const zip: <A, B>(self: Chunk<A>, that: Chunk<B>): Chunk<[A, B]>; // overload 2
export declare const zipWith: <A, B, C>(that: Chunk<B>, f: (a: A, b: B) => C): (self: Chunk<A>) => Chunk<C>; // overload 1
export declare const zipWith: <A, B, C>(self: Chunk<A>, that: Chunk<B>, f: (a: A, b: B) => C): Chunk<C>; // overload 2
```

## Other Exports (Non-Function)

- `Chunk` (interface)
- `ChunkTypeLambda` (interface)
- `NonEmptyChunk` (interface)
