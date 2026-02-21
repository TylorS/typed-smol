# API Reference: effect/MutableHashSet

- Import path: `effect/MutableHashSet`
- Source file: `packages/effect/src/MutableHashSet.ts`
- Function exports (callable): 8
- Non-function exports: 1

## Purpose

MutableHashSet is a high-performance, mutable set implementation that provides efficient storage and retrieval of unique values. Built on top of MutableHashMap, it inherits the same performance characteristics and support for both structural and referential equality.

## Key Function Exports

- `add`
- `clear`
- `empty`
- `fromIterable`
- `has`
- `make`
- `remove`
- `size`

## All Function Signatures

```ts
export declare const add: <V>(key: V): (self: MutableHashSet<V>) => MutableHashSet<V>; // overload 1
export declare const add: <V>(self: MutableHashSet<V>, key: V): MutableHashSet<V>; // overload 2
export declare const clear: <V>(self: MutableHashSet<V>): MutableHashSet<V>;
export declare const empty: <K = never>(): MutableHashSet<K>;
export declare const fromIterable: <K = never>(keys: Iterable<K>): MutableHashSet<K>;
export declare const has: <V>(key: V): (self: MutableHashSet<V>) => boolean; // overload 1
export declare const has: <V>(self: MutableHashSet<V>, key: V): boolean; // overload 2
export declare const make: <Keys extends ReadonlyArray<unknown>>(...keys: Keys): MutableHashSet<Keys[number]>;
export declare const remove: <V>(key: V): (self: MutableHashSet<V>) => MutableHashSet<V>; // overload 1
export declare const remove: <V>(self: MutableHashSet<V>, key: V): MutableHashSet<V>; // overload 2
export declare const size: <V>(self: MutableHashSet<V>): number;
```

## Other Exports (Non-Function)

- `MutableHashSet` (interface)
