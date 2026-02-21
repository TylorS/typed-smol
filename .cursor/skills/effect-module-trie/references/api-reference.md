# API Reference: effect/Trie

- Import path: `effect/Trie`
- Source file: `packages/effect/src/Trie.ts`
- Function exports (callable): 28
- Non-function exports: 1

## Purpose

A `Trie` is used for locating specific `string` keys from within a set.

## Key Function Exports

- `compact`
- `empty`
- `entries`
- `entriesWithPrefix`
- `filter`
- `filterMap`
- `forEach`
- `fromIterable`
- `get`
- `getUnsafe`
- `has`
- `insert`
- `insertMany`
- `isEmpty`
- `keys`
- `keysWithPrefix`
- `longestPrefixOf`
- `make`

## All Function Signatures

```ts
export declare const compact: <A>(self: Trie<Option<A>>): Trie<A>;
export declare const empty: <V = never>(): Trie<V>;
export declare const entries: <V>(self: Trie<V>): IterableIterator<[string, V]>;
export declare const entriesWithPrefix: (prefix: string): <V>(self: Trie<V>) => IterableIterator<[string, V]>; // overload 1
export declare const entriesWithPrefix: <V>(self: Trie<V>, prefix: string): IterableIterator<[string, V]>; // overload 2
export declare const filter: <A, B extends A>(f: (a: NoInfer<A>, k: string) => a is B): (self: Trie<A>) => Trie<B>; // overload 1
export declare const filter: <A>(f: (a: NoInfer<A>, k: string) => boolean): (self: Trie<A>) => Trie<A>; // overload 2
export declare const filter: <A, B extends A>(self: Trie<A>, f: (a: A, k: string) => a is B): Trie<B>; // overload 3
export declare const filter: <A>(self: Trie<A>, f: (a: A, k: string) => boolean): Trie<A>; // overload 4
export declare const filterMap: <A, B>(f: (value: A, key: string) => Option<B>): (self: Trie<A>) => Trie<B>; // overload 1
export declare const filterMap: <A, B>(self: Trie<A>, f: (value: A, key: string) => Option<B>): Trie<B>; // overload 2
export declare const forEach: <V>(f: (value: V, key: string) => void): (self: Trie<V>) => void; // overload 1
export declare const forEach: <V>(self: Trie<V>, f: (value: V, key: string) => void): void; // overload 2
export declare const fromIterable: <V>(entries: Iterable<readonly [string, V]>): Trie<V>;
export declare const get: (key: string): <V>(self: Trie<V>) => Option<V>; // overload 1
export declare const get: <V>(self: Trie<V>, key: string): Option<V>; // overload 2
export declare const getUnsafe: (key: string): <V>(self: Trie<V>) => V; // overload 1
export declare const getUnsafe: <V>(self: Trie<V>, key: string): V; // overload 2
export declare const has: (key: string): <V>(self: Trie<V>) => boolean; // overload 1
export declare const has: <V>(self: Trie<V>, key: string): boolean; // overload 2
export declare const insert: <V>(key: string, value: V): (self: Trie<V>) => Trie<V>; // overload 1
export declare const insert: <V>(self: Trie<V>, key: string, value: V): Trie<V>; // overload 2
export declare const insertMany: <V>(iter: Iterable<[string, V]>): (self: Trie<V>) => Trie<V>; // overload 1
export declare const insertMany: <V>(self: Trie<V>, iter: Iterable<[string, V]>): Trie<V>; // overload 2
export declare const isEmpty: <V>(self: Trie<V>): boolean;
export declare const keys: <V>(self: Trie<V>): IterableIterator<string>;
export declare const keysWithPrefix: (prefix: string): <V>(self: Trie<V>) => IterableIterator<string>; // overload 1
export declare const keysWithPrefix: <V>(self: Trie<V>, prefix: string): IterableIterator<string>; // overload 2
export declare const longestPrefixOf: (key: string): <V>(self: Trie<V>) => [string, V] | undefined; // overload 1
export declare const longestPrefixOf: <V>(self: Trie<V>, key: string): [string, V] | undefined; // overload 2
export declare const make: <Entries extends Array<readonly [string, any]>>(...entries: Entries): Trie<Entries[number] extends readonly [any, infer V] ? V : never>;
export declare const map: <A, V>(f: (value: V, key: string) => A): (self: Trie<V>) => Trie<A>; // overload 1
export declare const map: <V, A>(self: Trie<V>, f: (value: V, key: string) => A): Trie<A>; // overload 2
export declare const modify: <V>(key: string, f: (v: V) => V): (self: Trie<V>) => Trie<V>; // overload 1
export declare const modify: <V>(self: Trie<V>, key: string, f: (v: V) => V): Trie<V>; // overload 2
export declare const reduce: <Z, V>(zero: Z, f: (accumulator: Z, value: V, key: string) => Z): (self: Trie<V>) => Z; // overload 1
export declare const reduce: <Z, V>(self: Trie<V>, zero: Z, f: (accumulator: Z, value: V, key: string) => Z): Z; // overload 2
export declare const remove: (key: string): <V>(self: Trie<V>) => Trie<V>; // overload 1
export declare const remove: <V>(self: Trie<V>, key: string): Trie<V>; // overload 2
export declare const removeMany: (keys: Iterable<string>): <V>(self: Trie<V>) => Trie<V>; // overload 1
export declare const removeMany: <V>(self: Trie<V>, keys: Iterable<string>): Trie<V>; // overload 2
export declare const size: <V>(self: Trie<V>): number;
export declare const toEntries: <V>(self: Trie<V>): Array<[string, V]>;
export declare const toEntriesWithPrefix: (prefix: string): <V>(self: Trie<V>) => Array<[string, V]>; // overload 1
export declare const toEntriesWithPrefix: <V>(self: Trie<V>, prefix: string): Array<[string, V]>; // overload 2
export declare const values: <V>(self: Trie<V>): IterableIterator<V>;
export declare const valuesWithPrefix: (prefix: string): <V>(self: Trie<V>) => IterableIterator<V>; // overload 1
export declare const valuesWithPrefix: <V>(self: Trie<V>, prefix: string): IterableIterator<V>; // overload 2
```

## Other Exports (Non-Function)

- `Trie` (interface)
