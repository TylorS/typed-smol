# API Reference: effect/Record

- Import path: `effect/Record`
- Source file: `packages/effect/src/Record.ts`
- Function exports (callable): 42
- Non-function exports: 2

## Purpose

This module provides utility functions for working with records in TypeScript.

## Key Function Exports

- `collect`
- `difference`
- `empty`
- `every`
- `filter`
- `filterMap`
- `findFirst`
- `fromEntries`
- `fromIterableBy`
- `fromIterableWith`
- `get`
- `getFailures`
- `getSomes`
- `getSuccesses`
- `has`
- `intersection`
- `isEmptyReadonlyRecord`
- `isEmptyRecord`

## All Function Signatures

```ts
export declare const collect: <K extends string, A, B>(f: (key: K, a: A) => B): (self: ReadonlyRecord<K, A>) => Array<B>; // overload 1
export declare const collect: <K extends string, A, B>(self: ReadonlyRecord<K, A>, f: (key: K, a: A) => B): Array<B>; // overload 2
export declare const difference: <K1 extends string, B>(that: ReadonlyRecord<K1, B>): <K0 extends string, A>(self: ReadonlyRecord<K0, A>) => Record<K0 | K1, A | B>; // overload 1
export declare const difference: <K0 extends string, A, K1 extends string, B>(self: ReadonlyRecord<K0, A>, that: ReadonlyRecord<K1, B>): Record<K0 | K1, A | B>; // overload 2
export declare const empty: <K extends string | symbol = never, V = never>(): Record<ReadonlyRecord.NonLiteralKey<K>, V>;
export declare const every: <A, K extends string, B extends A>(refinement: (value: A, key: K) => value is B): (self: ReadonlyRecord<K, A>) => self is ReadonlyRecord<K, B>; // overload 1
export declare const every: <A, K extends string>(predicate: (value: A, key: K) => boolean): (self: ReadonlyRecord<K, A>) => boolean; // overload 2
export declare const every: <A, K extends string, B extends A>(self: ReadonlyRecord<K, A>, refinement: (value: A, key: K) => value is B): self is ReadonlyRecord<K, B>; // overload 3
export declare const every: <K extends string, A>(self: ReadonlyRecord<K, A>, predicate: (value: A, key: K) => boolean): boolean; // overload 4
export declare const filter: <K extends string, A, B extends A>(refinement: (a: NoInfer<A>, key: K) => a is B): (self: ReadonlyRecord<K, A>) => Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 1
export declare const filter: <K extends string, A>(predicate: (A: NoInfer<A>, key: K) => boolean): (self: ReadonlyRecord<K, A>) => Record<ReadonlyRecord.NonLiteralKey<K>, A>; // overload 2
export declare const filter: <K extends string, A, B extends A>(self: ReadonlyRecord<K, A>, refinement: (a: A, key: K) => a is B): Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 3
export declare const filter: <K extends string, A>(self: ReadonlyRecord<K, A>, predicate: (a: A, key: K) => boolean): Record<ReadonlyRecord.NonLiteralKey<K>, A>; // overload 4
export declare const filterMap: <K extends string, A, B>(f: (a: A, key: K) => Option.Option<B>): (self: ReadonlyRecord<K, A>) => Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 1
export declare const filterMap: <K extends string, A, B>(self: ReadonlyRecord<K, A>, f: (a: A, key: K) => Option.Option<B>): Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 2
export declare const findFirst: <K extends string | symbol, V, V2 extends V>(refinement: (value: NoInfer<V>, key: NoInfer<K>) => value is V2): (self: ReadonlyRecord<K, V>) => [K, V2] | undefined; // overload 1
export declare const findFirst: <K extends string | symbol, V>(predicate: (value: NoInfer<V>, key: NoInfer<K>) => boolean): (self: ReadonlyRecord<K, V>) => [K, V] | undefined; // overload 2
export declare const findFirst: <K extends string | symbol, V, V2 extends V>(self: ReadonlyRecord<K, V>, refinement: (value: NoInfer<V>, key: NoInfer<K>) => value is V2): [K, V2] | undefined; // overload 3
export declare const findFirst: <K extends string | symbol, V>(self: ReadonlyRecord<K, V>, predicate: (value: NoInfer<V>, key: NoInfer<K>) => boolean): [K, V] | undefined; // overload 4
export declare const fromEntries: <Entry extends readonly [string | symbol, any]>(entries: Iterable<Entry>): Record<ReadonlyRecord.NonLiteralKey<Entry[0]>, Entry[1]>;
export declare const fromIterableBy: <A, K extends string | symbol>(items: Iterable<A>, f: (a: A) => K): Record<ReadonlyRecord.NonLiteralKey<K>, A>;
export declare const fromIterableWith: <A, K extends string | symbol, B>(f: (a: A) => readonly [K, B]): (self: Iterable<A>) => Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 1
export declare const fromIterableWith: <A, K extends string | symbol, B>(self: Iterable<A>, f: (a: A) => readonly [K, B]): Record<ReadonlyRecord.NonLiteralKey<K>, B>; // overload 2
export declare const get: <K extends string | symbol>(key: NoInfer<K>): <A>(self: ReadonlyRecord<K, A>) => Option.Option<A>; // overload 1
export declare const get: <K extends string | symbol, A>(self: ReadonlyRecord<K, A>, key: NoInfer<K>): Option.Option<A>; // overload 2
export declare const getFailures: <K extends string, A, E>(self: ReadonlyRecord<K, Result<A, E>>): Record<ReadonlyRecord.NonLiteralKey<K>, E>;
export declare const getSomes: <K extends string, A>(self: ReadonlyRecord<K, Option.Option<A>>): Record<ReadonlyRecord.NonLiteralKey<K>, A>;
export declare const getSuccesses: <K extends string, A, E>(self: ReadonlyRecord<K, Result<A, E>>): Record<string, A>;
export declare const has: <K extends string | symbol>(key: NoInfer<K>): <A>(self: ReadonlyRecord<K, A>) => boolean; // overload 1
export declare const has: <K extends string | symbol, A>(self: ReadonlyRecord<K, A>, key: NoInfer<K>): boolean; // overload 2
export declare const intersection: <K1 extends string, A, B, C>(that: ReadonlyRecord<K1, B>, combine: (selfValue: A, thatValue: B) => C): <K0 extends string>(self: ReadonlyRecord<K0, A>) => Record<ReadonlyRecord.IntersectKeys<K0, K1>, C>; // overload 1
export declare const intersection: <K0 extends string, A, K1 extends string, B, C>(self: ReadonlyRecord<K0, A>, that: ReadonlyRecord<K1, B>, combine: (selfValue: A, thatValue: B) => C): Record<ReadonlyRecord.IntersectKeys<K0, K1>, C>; // overload 2
export declare const isEmptyReadonlyRecord: <K extends string, A>(self: ReadonlyRecord<K, A>): self is ReadonlyRecord<K, never>;
export declare const isEmptyRecord: <K extends string, A>(self: Record<K, A>): self is Record<K, never>;
export declare const isSubrecord: <K extends string, A>(that: ReadonlyRecord<K, A>): (self: ReadonlyRecord<K, A>) => boolean; // overload 1
export declare const isSubrecord: <K extends string, A>(self: ReadonlyRecord<K, A>, that: ReadonlyRecord<K, A>): boolean; // overload 2
export declare const isSubrecordBy: <A>(equivalence: Equivalence<A>): { <K extends string>(that: ReadonlyRecord<K, A>): (self: ReadonlyRecord<K, A>) => boolean; <K extends string>(self: ReadonlyRecord<K, A>, that: ReadonlyRecord<K, A>): boolean; };
export declare const keys: <K extends string | symbol, A>(self: ReadonlyRecord<K, A>): Array<K & string>;
export declare const makeEquivalence: <K extends string, A>(equivalence: Equivalence<A>): Equivalence<ReadonlyRecord<K, A>>;
export declare const makeReducerIntersection: <K extends string, A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<Record<K, A>>;
export declare const makeReducerUnion: <K extends string, A>(combiner: Combiner.Combiner<A>): Reducer.Reducer<Record<K, A>>;
export declare const map: <K extends string, A, B>(f: (a: A, key: NoInfer<K>) => B): (self: ReadonlyRecord<K, A>) => Record<K, B>; // overload 1
export declare const map: <K extends string, A, B>(self: ReadonlyRecord<K, A>, f: (a: A, key: NoInfer<K>) => B): Record<K, B>; // overload 2
export declare const mapEntries: <K extends string, A, K2 extends string, B>(f: (a: A, key: K) => readonly [K2, B]): (self: ReadonlyRecord<K, A>) => Record<K2, B>; // overload 1
export declare const mapEntries: <K extends string, A, K2 extends string, B>(self: ReadonlyRecord<K, A>, f: (a: A, key: K) => [K2, B]): Record<K2, B>; // overload 2
export declare const mapKeys: <K extends string, A, K2 extends string>(f: (key: K, a: A) => K2): (self: ReadonlyRecord<K, A>) => Record<K2, A>; // overload 1
export declare const mapKeys: <K extends string, A, K2 extends string>(self: ReadonlyRecord<K, A>, f: (key: K, a: A) => K2): Record<K2, A>; // overload 2
export declare const modify: <K extends string | symbol, A, B>(key: NoInfer<K>, f: (a: A) => B): (self: ReadonlyRecord<K, A>) => Record<K, A | B> | undefined; // overload 1
export declare const modify: <K extends string | symbol, A, B>(self: ReadonlyRecord<K, A>, key: NoInfer<K>, f: (a: A) => B): Record<K, A | B> | undefined; // overload 2
export declare const partition: <K extends string, A, B extends A>(refinement: (a: NoInfer<A>, key: K) => a is B): (self: ReadonlyRecord<K, A>) => [excluded: Record<ReadonlyRecord.NonLiteralKey<K>, Exclude<A, B>>, satisfying: Record<ReadonlyRecord.NonLiteralKey<K>, B>]; // overload 1
export declare const partition: <K extends string, A>(predicate: (a: NoInfer<A>, key: K) => boolean): (self: ReadonlyRecord<K, A>) => [excluded: Record<ReadonlyRecord.NonLiteralKey<K>, A>, satisfying: Record<ReadonlyRecord.NonLiteralKey<K>, A>]; // overload 2
export declare const partition: <K extends string, A, B extends A>(self: ReadonlyRecord<K, A>, refinement: (a: A, key: K) => a is B): [excluded: Record<ReadonlyRecord.NonLiteralKey<K>, Exclude<A, B>>, satisfying: Record<ReadonlyRecord.NonLiteralKey<K>, B>]; // overload 3
export declare const partition: <K extends string, A>(self: ReadonlyRecord<K, A>, predicate: (a: A, key: K) => boolean): [excluded: Record<ReadonlyRecord.NonLiteralKey<K>, A>, satisfying: Record<ReadonlyRecord.NonLiteralKey<K>, A>]; // overload 4
export declare const partitionMap: <K extends string, A, B, C>(f: (a: A, key: K) => Result<C, B>): (self: ReadonlyRecord<K, A>) => [left: Record<ReadonlyRecord.NonLiteralKey<K>, B>, right: Record<ReadonlyRecord.NonLiteralKey<K>, C>]; // overload 1
export declare const partitionMap: <K extends string, A, B, C>(self: ReadonlyRecord<K, A>, f: (a: A, key: K) => Result<C, B>): [left: Record<ReadonlyRecord.NonLiteralKey<K>, B>, right: Record<ReadonlyRecord.NonLiteralKey<K>, C>]; // overload 2
export declare const pop: <K extends string | symbol, X extends K>(key: X): <A>(self: ReadonlyRecord<K, A>) => [A, Record<Exclude<K, X>, A>] | undefined; // overload 1
export declare const pop: <K extends string | symbol, A, X extends K>(self: ReadonlyRecord<K, A>, key: X): [A, Record<Exclude<K, X>, A>] | undefined; // overload 2
export declare const reduce: <Z, V, K extends string>(zero: Z, f: (accumulator: Z, value: V, key: K) => Z): (self: ReadonlyRecord<K, V>) => Z; // overload 1
export declare const reduce: <K extends string, V, Z>(self: ReadonlyRecord<K, V>, zero: Z, f: (accumulator: Z, value: V, key: K) => Z): Z; // overload 2
export declare const remove: <K extends string | symbol, X extends K>(key: X): <A>(self: ReadonlyRecord<K, A>) => Record<Exclude<K, X>, A>; // overload 1
export declare const remove: <K extends string | symbol, A, X extends K>(self: ReadonlyRecord<K, A>, key: X): Record<Exclude<K, X>, A>; // overload 2
export declare const replace: <K extends string | symbol, B>(key: NoInfer<K>, b: B): <A>(self: ReadonlyRecord<K, A>) => Record<K, A | B> | undefined; // overload 1
export declare const replace: <K extends string | symbol, A, B>(self: ReadonlyRecord<K, A>, key: NoInfer<K>, b: B): Record<K, A | B> | undefined; // overload 2
export declare const separate: <K extends string, A, B>(self: ReadonlyRecord<K, Result<B, A>>): [Record<ReadonlyRecord.NonLiteralKey<K>, A>, Record<ReadonlyRecord.NonLiteralKey<K>, B>];
export declare const set: <K extends string | symbol, K1 extends K | ((string | symbol) & {}), B>(key: K1, value: B): <A>(self: ReadonlyRecord<K, A>) => Record<K | K1, A | B>; // overload 1
export declare const set: <K extends string | symbol, A, K1 extends K | ((string | symbol) & {}), B>(self: ReadonlyRecord<K, A>, key: K1, value: B): Record<K | K1, A | B>; // overload 2
export declare const singleton: <K extends string | symbol, A>(key: K, value: A): Record<K, A>;
export declare const size: <K extends string, A>(self: ReadonlyRecord<K, A>): number;
export declare const some: <A, K extends string>(predicate: (value: A, key: K) => boolean): (self: ReadonlyRecord<K, A>) => boolean; // overload 1
export declare const some: <K extends string, A>(self: ReadonlyRecord<K, A>, predicate: (value: A, key: K) => boolean): boolean; // overload 2
export declare const toEntries: <K extends string, A>(self: ReadonlyRecord<K, A>): Array<[K, A]>;
export declare const union: <K1 extends string, A, B, C>(that: ReadonlyRecord<K1, B>, combine: (selfValue: A, thatValue: B) => C): <K0 extends string>(self: ReadonlyRecord<K0, A>) => Record<K0 | K1, A | B | C>; // overload 1
export declare const union: <K0 extends string, A, K1 extends string, B, C>(self: ReadonlyRecord<K0, A>, that: ReadonlyRecord<K1, B>, combine: (selfValue: A, thatValue: B) => C): Record<K0 | K1, A | B | C>; // overload 2
export declare const values: <K extends string, A>(self: ReadonlyRecord<K, A>): Array<A>;
```

## Other Exports (Non-Function)

- `ReadonlyRecord` (type)
- `ReadonlyRecordTypeLambda` (interface)
