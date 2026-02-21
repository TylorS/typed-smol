# API Reference: effect/HashSet

- Import path: `effect/HashSet`
- Source file: `packages/effect/src/HashSet.ts`
- Function exports (callable): 18
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `difference`
- `empty`
- `every`
- `filter`
- `fromIterable`
- `has`
- `intersection`
- `isEmpty`
- `isHashSet`
- `isSubset`
- `make`
- `map`
- `reduce`
- `remove`
- `size`
- `some`
- `union`

## All Function Signatures

```ts
export declare const add: <V>(value: V): (self: HashSet<V>) => HashSet<V>; // overload 1
export declare const add: <V>(self: HashSet<V>, value: V): HashSet<V>; // overload 2
export declare const difference: <V1>(that: HashSet<V1>): <V0>(self: HashSet<V0>) => HashSet<V0>; // overload 1
export declare const difference: <V0, V1>(self: HashSet<V0>, that: HashSet<V1>): HashSet<V0>; // overload 2
export declare const empty: <V = never>(): HashSet<V>;
export declare const every: <V>(predicate: Predicate<V>): (self: HashSet<V>) => boolean; // overload 1
export declare const every: <V>(self: HashSet<V>, predicate: Predicate<V>): boolean; // overload 2
export declare const filter: <V, U extends V>(refinement: Refinement<NoInfer<V>, U>): (self: HashSet<V>) => HashSet<U>; // overload 1
export declare const filter: <V>(predicate: Predicate<NoInfer<V>>): (self: HashSet<V>) => HashSet<V>; // overload 2
export declare const filter: <V, U extends V>(self: HashSet<V>, refinement: Refinement<V, U>): HashSet<U>; // overload 3
export declare const filter: <V>(self: HashSet<V>, predicate: Predicate<V>): HashSet<V>; // overload 4
export declare const fromIterable: <V>(values: Iterable<V>): HashSet<V>;
export declare const has: <V>(value: V): (self: HashSet<V>) => boolean; // overload 1
export declare const has: <V>(self: HashSet<V>, value: V): boolean; // overload 2
export declare const intersection: <V1>(that: HashSet<V1>): <V0>(self: HashSet<V0>) => HashSet<V1 & V0>; // overload 1
export declare const intersection: <V0, V1>(self: HashSet<V0>, that: HashSet<V1>): HashSet<V0 & V1>; // overload 2
export declare const isEmpty: <V>(self: HashSet<V>): boolean;
export declare const isHashSet: <V>(u: Iterable<V>): u is HashSet<V>; // overload 1
export declare const isHashSet: (u: unknown): u is HashSet<unknown>; // overload 2
export declare const isSubset: <V1>(that: HashSet<V1>): <V0>(self: HashSet<V0>) => boolean; // overload 1
export declare const isSubset: <V0, V1>(self: HashSet<V0>, that: HashSet<V1>): boolean; // overload 2
export declare const make: <Values extends ReadonlyArray<any>>(...values: Values): HashSet<Values[number]>;
export declare const map: <V, U>(f: (value: V) => U): (self: HashSet<V>) => HashSet<U>; // overload 1
export declare const map: <V, U>(self: HashSet<V>, f: (value: V) => U): HashSet<U>; // overload 2
export declare const reduce: <V, U>(zero: U, f: (accumulator: U, value: V) => U): (self: HashSet<V>) => U; // overload 1
export declare const reduce: <V, U>(self: HashSet<V>, zero: U, f: (accumulator: U, value: V) => U): U; // overload 2
export declare const remove: <V>(value: V): (self: HashSet<V>) => HashSet<V>; // overload 1
export declare const remove: <V>(self: HashSet<V>, value: V): HashSet<V>; // overload 2
export declare const size: <V>(self: HashSet<V>): number;
export declare const some: <V>(predicate: Predicate<V>): (self: HashSet<V>) => boolean; // overload 1
export declare const some: <V>(self: HashSet<V>, predicate: Predicate<V>): boolean; // overload 2
export declare const union: <V1>(that: HashSet<V1>): <V0>(self: HashSet<V0>) => HashSet<V1 | V0>; // overload 1
export declare const union: <V0, V1>(self: HashSet<V0>, that: HashSet<V1>): HashSet<V0 | V1>; // overload 2
```

## Other Exports (Non-Function)

- `HashSet` (interface)
