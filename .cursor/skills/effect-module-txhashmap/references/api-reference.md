# API Reference: effect/TxHashMap

- Import path: `effect/TxHashMap`
- Source file: `packages/effect/src/TxHashMap.ts`
- Function exports (callable): 36
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `clear`
- `compact`
- `empty`
- `entries`
- `every`
- `filter`
- `filterMap`
- `findFirst`
- `flatMap`
- `forEach`
- `fromIterable`
- `get`
- `getHash`
- `has`
- `hasBy`
- `hasHash`
- `isEmpty`
- `isNonEmpty`

## All Function Signatures

```ts
export declare const clear: <K, V>(self: TxHashMap<K, V>): Effect.Effect<void>;
export declare const compact: <K, A>(self: TxHashMap<K, Option.Option<A>>): Effect.Effect<TxHashMap<K, A>>;
export declare const empty: <K, V>(): Effect.Effect<TxHashMap<K, V>>;
export declare const entries: <K, V>(self: TxHashMap<K, V>): Effect.Effect<Array<readonly [K, V]>>;
export declare const every: <K, V>(predicate: (value: V, key: K) => boolean): (self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const every: <K, V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => boolean): Effect.Effect<boolean>; // overload 2
export declare const filter: <K, V, B extends V>(predicate: (value: V, key: K) => value is B): (self: TxHashMap<K, V>) => Effect.Effect<TxHashMap<K, B>>; // overload 1
export declare const filter: <K, V>(predicate: (value: V, key: K) => boolean): (self: TxHashMap<K, V>) => Effect.Effect<TxHashMap<K, V>>; // overload 2
export declare const filter: <K, V, B extends V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => value is B): Effect.Effect<TxHashMap<K, B>>; // overload 3
export declare const filter: <K, V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => boolean): Effect.Effect<TxHashMap<K, V>>; // overload 4
export declare const filterMap: <A, V, K>(f: (value: V, key: K) => Option.Option<A>): (self: TxHashMap<K, V>) => Effect.Effect<TxHashMap<K, A>>; // overload 1
export declare const filterMap: <K, V, A>(self: TxHashMap<K, V>, f: (value: V, key: K) => Option.Option<A>): Effect.Effect<TxHashMap<K, A>>; // overload 2
export declare const findFirst: <K, V>(predicate: (value: V, key: K) => boolean): (self: TxHashMap<K, V>) => Effect.Effect<[K, V] | undefined>; // overload 1
export declare const findFirst: <K, V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => boolean): Effect.Effect<[K, V] | undefined>; // overload 2
export declare const flatMap: <A, V, K>(f: (value: V, key: K) => Effect.Effect<TxHashMap<K, A>>): (self: TxHashMap<K, V>) => Effect.Effect<TxHashMap<K, A>>; // overload 1
export declare const flatMap: <K, V, A>(self: TxHashMap<K, V>, f: (value: V, key: K) => Effect.Effect<TxHashMap<K, A>>): Effect.Effect<TxHashMap<K, A>>; // overload 2
export declare const forEach: <V, K, R, E>(f: (value: V, key: K) => Effect.Effect<void, E, R>): (self: TxHashMap<K, V>) => Effect.Effect<void, E, R>; // overload 1
export declare const forEach: <K, V, R, E>(self: TxHashMap<K, V>, f: (value: V, key: K) => Effect.Effect<void, E, R>): Effect.Effect<void, E, R>; // overload 2
export declare const fromIterable: <K, V>(entries: Iterable<readonly [K, V]>): Effect.Effect<TxHashMap<K, V>>;
export declare const get: <K1 extends K, K>(key: K1): <V>(self: TxHashMap<K, V>) => Effect.Effect<Option.Option<V>>; // overload 1
export declare const get: <K1 extends K, K, V>(self: TxHashMap<K, V>, key: K1): Effect.Effect<Option.Option<V>>; // overload 2
export declare const getHash: <K1 extends K, K>(key: K1, hash: number): <V>(self: TxHashMap<K, V>) => Effect.Effect<Option.Option<V>>; // overload 1
export declare const getHash: <K1 extends K, K, V>(self: TxHashMap<K, V>, key: K1, hash: number): Effect.Effect<Option.Option<V>>; // overload 2
export declare const has: <K1 extends K, K>(key: K1): <V>(self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const has: <K1 extends K, K, V>(self: TxHashMap<K, V>, key: K1): Effect.Effect<boolean>; // overload 2
export declare const hasBy: <K, V>(predicate: (value: V, key: K) => boolean): (self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const hasBy: <K, V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => boolean): Effect.Effect<boolean>; // overload 2
export declare const hasHash: <K1 extends K, K>(key: K1, hash: number): <V>(self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const hasHash: <K1 extends K, K, V>(self: TxHashMap<K, V>, key: K1, hash: number): Effect.Effect<boolean>; // overload 2
export declare const isEmpty: <K, V>(self: TxHashMap<K, V>): Effect.Effect<boolean>;
export declare const isNonEmpty: <K, V>(self: TxHashMap<K, V>): Effect.Effect<boolean>;
export declare const isTxHashMap: <K, V>(value: unknown): value is TxHashMap<K, V>;
export declare const keys: <K, V>(self: TxHashMap<K, V>): Effect.Effect<Array<K>>;
export declare const make: <K, V>(...entries: Array<readonly [K, V]>): Effect.Effect<TxHashMap<K, V>>;
export declare const map: <A, V, K>(f: (value: V, key: K) => A): (self: TxHashMap<K, V>) => Effect.Effect<TxHashMap<K, A>>; // overload 1
export declare const map: <K, V, A>(self: TxHashMap<K, V>, f: (value: V, key: K) => A): Effect.Effect<TxHashMap<K, A>>; // overload 2
export declare const modify: <K, V>(key: K, f: (value: V) => V): (self: TxHashMap<K, V>) => Effect.Effect<Option.Option<V>>; // overload 1
export declare const modify: <K, V>(self: TxHashMap<K, V>, key: K, f: (value: V) => V): Effect.Effect<Option.Option<V>>; // overload 2
export declare const modifyAt: <K, V>(key: K, f: (value: Option.Option<V>) => Option.Option<V>): (self: TxHashMap<K, V>) => Effect.Effect<void>; // overload 1
export declare const modifyAt: <K, V>(self: TxHashMap<K, V>, key: K, f: (value: Option.Option<V>) => Option.Option<V>): Effect.Effect<void>; // overload 2
export declare const reduce: <A, V, K>(zero: A, f: (accumulator: A, value: V, key: K) => A): (self: TxHashMap<K, V>) => Effect.Effect<A>; // overload 1
export declare const reduce: <K, V, A>(self: TxHashMap<K, V>, zero: A, f: (accumulator: A, value: V, key: K) => A): Effect.Effect<A>; // overload 2
export declare const remove: <K1 extends K, K>(key: K1): <V>(self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const remove: <K1 extends K, K, V>(self: TxHashMap<K, V>, key: K1): Effect.Effect<boolean>; // overload 2
export declare const removeMany: <K1 extends K, K>(keys: Iterable<K1>): <V>(self: TxHashMap<K, V>) => Effect.Effect<void>; // overload 1
export declare const removeMany: <K1 extends K, K, V>(self: TxHashMap<K, V>, keys: Iterable<K1>): Effect.Effect<void>; // overload 2
export declare const set: <K, V>(key: K, value: V): (self: TxHashMap<K, V>) => Effect.Effect<void>; // overload 1
export declare const set: <K, V>(self: TxHashMap<K, V>, key: K, value: V): Effect.Effect<void>; // overload 2
export declare const setMany: <K1 extends K, K, V1 extends V, V>(entries: Iterable<readonly [K1, V1]>): (self: TxHashMap<K, V>) => Effect.Effect<void>; // overload 1
export declare const setMany: <K1 extends K, K, V1 extends V, V>(self: TxHashMap<K, V>, entries: Iterable<readonly [K1, V1]>): Effect.Effect<void>; // overload 2
export declare const size: <K, V>(self: TxHashMap<K, V>): Effect.Effect<number>;
export declare const snapshot: <K, V>(self: TxHashMap<K, V>): Effect.Effect<HashMap.HashMap<K, V>>;
export declare const some: <K, V>(predicate: (value: V, key: K) => boolean): (self: TxHashMap<K, V>) => Effect.Effect<boolean>; // overload 1
export declare const some: <K, V>(self: TxHashMap<K, V>, predicate: (value: V, key: K) => boolean): Effect.Effect<boolean>; // overload 2
export declare const toEntries: <K, V>(self: TxHashMap<K, V>): Effect.Effect<Array<readonly [K, V]>>;
export declare const toValues: <K, V>(self: TxHashMap<K, V>): Effect.Effect<Array<V>>;
export declare const union: <K1 extends K, K, V1 extends V, V>(other: HashMap.HashMap<K1, V1>): (self: TxHashMap<K, V>) => Effect.Effect<void>; // overload 1
export declare const union: <K1 extends K, K, V1 extends V, V>(self: TxHashMap<K, V>, other: HashMap.HashMap<K1, V1>): Effect.Effect<void>; // overload 2
export declare const values: <K, V>(self: TxHashMap<K, V>): Effect.Effect<Array<V>>;
```

## Other Exports (Non-Function)

- `TxHashMap` (interface)
