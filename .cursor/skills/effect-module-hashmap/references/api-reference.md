# API Reference: effect/HashMap

- Import path: `effect/HashMap`
- Source file: `packages/effect/src/HashMap.ts`
- Function exports (callable): 38
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `beginMutation`
- `compact`
- `empty`
- `endMutation`
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
- `getUnsafe`
- `has`
- `hasBy`
- `hasHash`

## All Function Signatures

```ts
export declare const beginMutation: <K, V>(self: HashMap<K, V>): HashMap<K, V>;
export declare const compact: <K, A>(self: HashMap<K, Option<A>>): HashMap<K, A>;
export declare const empty: <K = never, V = never>(): HashMap<K, V>;
export declare const endMutation: <K, V>(self: HashMap<K, V>): HashMap<K, V>;
export declare const entries: <K, V>(self: HashMap<K, V>): IterableIterator<[K, V]>;
export declare const every: <K, A>(predicate: (a: NoInfer<A>, k: K) => boolean): (self: HashMap<K, A>) => boolean; // overload 1
export declare const every: <K, A>(self: HashMap<K, A>, predicate: (a: A, k: K) => boolean): boolean; // overload 2
export declare const filter: <K, A>(f: (a: NoInfer<A>, k: K) => boolean): (self: HashMap<K, A>) => HashMap<K, A>; // overload 1
export declare const filter: <K, A>(self: HashMap<K, A>, f: (a: A, k: K) => boolean): HashMap<K, A>; // overload 2
export declare const filterMap: <A, K, B>(f: (value: A, key: K) => Option<B>): (self: HashMap<K, A>) => HashMap<K, B>; // overload 1
export declare const filterMap: <K, A, B>(self: HashMap<K, A>, f: (value: A, key: K) => Option<B>): HashMap<K, B>; // overload 2
export declare const findFirst: <K, A>(predicate: (a: NoInfer<A>, k: K) => boolean): (self: HashMap<K, A>) => [K, A] | undefined; // overload 1
export declare const findFirst: <K, A>(self: HashMap<K, A>, predicate: (a: A, k: K) => boolean): [K, A] | undefined; // overload 2
export declare const flatMap: <A, K, B>(f: (value: A, key: K) => HashMap<K, B>): (self: HashMap<K, A>) => HashMap<K, B>; // overload 1
export declare const flatMap: <K, A, B>(self: HashMap<K, A>, f: (value: A, key: K) => HashMap<K, B>): HashMap<K, B>; // overload 2
export declare const forEach: <V, K>(f: (value: V, key: K) => void): (self: HashMap<K, V>) => void; // overload 1
export declare const forEach: <V, K>(self: HashMap<K, V>, f: (value: V, key: K) => void): void; // overload 2
export declare const fromIterable: <K, V>(entries: Iterable<readonly [K, V]>): HashMap<K, V>;
export declare const get: <K1 extends K, K>(key: K1): <V>(self: HashMap<K, V>) => Option<V>; // overload 1
export declare const get: <K1 extends K, K, V>(self: HashMap<K, V>, key: K1): Option<V>; // overload 2
export declare const getHash: <K1 extends K, K>(key: K1, hash: number): <V>(self: HashMap<K, V>) => Option<V>; // overload 1
export declare const getHash: <K1 extends K, K, V>(self: HashMap<K, V>, key: K1, hash: number): Option<V>; // overload 2
export declare const getUnsafe: <K1 extends K, K>(key: K1): <V>(self: HashMap<K, V>) => V; // overload 1
export declare const getUnsafe: <K1 extends K, K, V>(self: HashMap<K, V>, key: K1): V; // overload 2
export declare const has: <K1 extends K, K>(key: K1): <K, V>(self: HashMap<K, V>) => boolean; // overload 1
export declare const has: <K1 extends K, K, V>(self: HashMap<K, V>, key: K1): boolean; // overload 2
export declare const hasBy: <K, V>(predicate: (value: NoInfer<V>, key: NoInfer<K>) => boolean): (self: HashMap<K, V>) => boolean; // overload 1
export declare const hasBy: <K, V>(self: HashMap<K, V>, predicate: (value: NoInfer<V>, key: NoInfer<K>) => boolean): boolean; // overload 2
export declare const hasHash: <K1 extends K, K>(key: K1, hash: number): <V>(self: HashMap<K, V>) => boolean; // overload 1
export declare const hasHash: <K1 extends K, K, V>(self: HashMap<K, V>, key: K1, hash: number): boolean; // overload 2
export declare const isEmpty: <K, V>(self: HashMap<K, V>): boolean;
export declare const isHashMap: <K, V>(u: Iterable<readonly [K, V]>): u is HashMap<K, V>; // overload 1
export declare const isHashMap: (u: unknown): u is HashMap<unknown, unknown>; // overload 2
export declare const keys: <K, V>(self: HashMap<K, V>): IterableIterator<K>;
export declare const make: <Entries extends ReadonlyArray<readonly [any, any]>>(...entries: Entries): HashMap<Entries[number] extends readonly [infer K, any] ? K : never, Entries[number] extends readonly [any, infer V] ? V : never>;
export declare const map: <A, V, K>(f: (value: V, key: K) => A): (self: HashMap<K, V>) => HashMap<K, A>; // overload 1
export declare const map: <K, V, A>(self: HashMap<K, V>, f: (value: V, key: K) => A): HashMap<K, A>; // overload 2
export declare const modify: <K, V>(key: K, f: (v: V) => V): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const modify: <K, V>(self: HashMap<K, V>, key: K, f: (v: V) => V): HashMap<K, V>; // overload 2
export declare const modifyAt: <K, V>(key: K, f: HashMap.UpdateFn<V>): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const modifyAt: <K, V>(self: HashMap<K, V>, key: K, f: HashMap.UpdateFn<V>): HashMap<K, V>; // overload 2
export declare const modifyHash: <K, V>(key: K, hash: number, f: HashMap.UpdateFn<V>): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const modifyHash: <K, V>(self: HashMap<K, V>, key: K, hash: number, f: HashMap.UpdateFn<V>): HashMap<K, V>; // overload 2
export declare const mutate: <K, V>(f: (self: HashMap<K, V>) => void): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const mutate: <K, V>(self: HashMap<K, V>, f: (self: HashMap<K, V>) => void): HashMap<K, V>; // overload 2
export declare const reduce: <Z, V, K>(zero: Z, f: (accumulator: Z, value: V, key: K) => Z): (self: HashMap<K, V>) => Z; // overload 1
export declare const reduce: <K, V, Z>(self: HashMap<K, V>, zero: Z, f: (accumulator: Z, value: V, key: K) => Z): Z; // overload 2
export declare const remove: <K>(key: K): <V>(self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const remove: <K, V>(self: HashMap<K, V>, key: K): HashMap<K, V>; // overload 2
export declare const removeMany: <K>(keys: Iterable<K>): <V>(self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const removeMany: <K, V>(self: HashMap<K, V>, keys: Iterable<K>): HashMap<K, V>; // overload 2
export declare const set: <K, V>(key: K, value: V): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const set: <K, V>(self: HashMap<K, V>, key: K, value: V): HashMap<K, V>; // overload 2
export declare const setMany: <K, V>(entries: Iterable<readonly [K, V]>): (self: HashMap<K, V>) => HashMap<K, V>; // overload 1
export declare const setMany: <K, V>(self: HashMap<K, V>, entries: Iterable<readonly [K, V]>): HashMap<K, V>; // overload 2
export declare const size: <K, V>(self: HashMap<K, V>): number;
export declare const some: <K, A>(predicate: (a: NoInfer<A>, k: K) => boolean): (self: HashMap<K, A>) => boolean; // overload 1
export declare const some: <K, A>(self: HashMap<K, A>, predicate: (a: A, k: K) => boolean): boolean; // overload 2
export declare const toEntries: <K, V>(self: HashMap<K, V>): Array<[K, V]>;
export declare const toValues: <K, V>(self: HashMap<K, V>): Array<V>;
export declare const union: <K1, V1>(that: HashMap<K1, V1>): <K0, V0>(self: HashMap<K0, V0>) => HashMap<K1 | K0, V1 | V0>; // overload 1
export declare const union: <K0, V0, K1, V1>(self: HashMap<K0, V0>, that: HashMap<K1, V1>): HashMap<K0 | K1, V0 | V1>; // overload 2
export declare const values: <K, V>(self: HashMap<K, V>): IterableIterator<V>;
```

## Other Exports (Non-Function)

- `HashMap` (interface)
