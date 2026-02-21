# API Reference: effect/MutableHashMap

- Import path: `effect/MutableHashMap`
- Source file: `packages/effect/src/MutableHashMap.ts`
- Function exports (callable): 15
- Non-function exports: 1

## Purpose

MutableHashMap is a high-performance, mutable hash map implementation designed for efficient key-value storage with support for both structural and referential equality. It provides O(1) average-case performance for basic operations and integrates seamlessly with Effect's Equal and Hash interfaces.

## Key Function Exports

- `clear`
- `empty`
- `forEach`
- `fromIterable`
- `get`
- `has`
- `isEmpty`
- `keys`
- `make`
- `modify`
- `modifyAt`
- `remove`
- `set`
- `size`
- `values`

## All Function Signatures

```ts
export declare const clear: <K, V>(self: MutableHashMap<K, V>): MutableHashMap<K, V>;
export declare const empty: <K, V>(): MutableHashMap<K, V>;
export declare const forEach: <K, V>(f: (value: V, key: K) => void): (self: MutableHashMap<K, V>) => void; // overload 1
export declare const forEach: <K, V>(self: MutableHashMap<K, V>, f: (value: V, key: K) => void): void; // overload 2
export declare const fromIterable: <K, V>(entries: Iterable<readonly [K, V]>): MutableHashMap<K, V>;
export declare const get: <K>(key: K): <V>(self: MutableHashMap<K, V>) => Option.Option<V>; // overload 1
export declare const get: <K, V>(self: MutableHashMap<K, V>, key: K): Option.Option<V>; // overload 2
export declare const has: <K>(key: K): <V>(self: MutableHashMap<K, V>) => boolean; // overload 1
export declare const has: <K, V>(self: MutableHashMap<K, V>, key: K): boolean; // overload 2
export declare const isEmpty: <K, V>(self: MutableHashMap<K, V>): boolean;
export declare const keys: <K, V>(self: MutableHashMap<K, V>): Iterable<K>;
export declare const make: <Entries extends Array<readonly [any, any]>>(...entries: Entries): MutableHashMap<Entries[number] extends readonly [infer K, any] ? K : never, Entries[number] extends readonly [any, infer V] ? V : never>;
export declare const modify: <K, V>(key: K, f: (v: V) => V): (self: MutableHashMap<K, V>) => MutableHashMap<K, V>; // overload 1
export declare const modify: <K, V>(self: MutableHashMap<K, V>, key: K, f: (v: V) => V): MutableHashMap<K, V>; // overload 2
export declare const modifyAt: <K, V>(key: K, f: (value: Option.Option<V>) => Option.Option<V>): (self: MutableHashMap<K, V>) => MutableHashMap<K, V>; // overload 1
export declare const modifyAt: <K, V>(self: MutableHashMap<K, V>, key: K, f: (value: Option.Option<V>) => Option.Option<V>): MutableHashMap<K, V>; // overload 2
export declare const remove: <K>(key: K): <V>(self: MutableHashMap<K, V>) => MutableHashMap<K, V>; // overload 1
export declare const remove: <K, V>(self: MutableHashMap<K, V>, key: K): MutableHashMap<K, V>; // overload 2
export declare const set: <K, V>(key: K, value: V): (self: MutableHashMap<K, V>) => MutableHashMap<K, V>; // overload 1
export declare const set: <K, V>(self: MutableHashMap<K, V>, key: K, value: V): MutableHashMap<K, V>; // overload 2
export declare const size: <K, V>(self: MutableHashMap<K, V>): number;
export declare const values: <K, V>(self: MutableHashMap<K, V>): Iterable<V>;
```

## Other Exports (Non-Function)

- `MutableHashMap` (interface)
