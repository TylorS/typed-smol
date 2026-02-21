# API Reference: effect/TxHashSet

- Import path: `effect/TxHashSet`
- Source file: `packages/effect/src/TxHashSet.ts`
- Function exports (callable): 21
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `clear`
- `difference`
- `empty`
- `every`
- `filter`
- `fromHashSet`
- `fromIterable`
- `has`
- `intersection`
- `isEmpty`
- `isSubset`
- `isTxHashSet`
- `make`
- `map`
- `reduce`
- `remove`
- `size`

## All Function Signatures

```ts
export declare const add: <V>(value: V): (self: TxHashSet<V>) => Effect.Effect<void>; // overload 1
export declare const add: <V>(self: TxHashSet<V>, value: V): Effect.Effect<void>; // overload 2
export declare const clear: <V>(self: TxHashSet<V>): Effect.Effect<void>;
export declare const difference: <V1>(that: TxHashSet<V1>): <V0>(self: TxHashSet<V0>) => Effect.Effect<TxHashSet<V0>>; // overload 1
export declare const difference: <V0, V1>(self: TxHashSet<V0>, that: TxHashSet<V1>): Effect.Effect<TxHashSet<V0>>; // overload 2
export declare const empty: <V = never>(): Effect.Effect<TxHashSet<V>>;
export declare const every: <V>(predicate: Predicate<V>): (self: TxHashSet<V>) => Effect.Effect<boolean>; // overload 1
export declare const every: <V>(self: TxHashSet<V>, predicate: Predicate<V>): Effect.Effect<boolean>; // overload 2
export declare const filter: <V, U extends V>(refinement: Refinement<NoInfer<V>, U>): (self: TxHashSet<V>) => Effect.Effect<TxHashSet<U>>; // overload 1
export declare const filter: <V>(predicate: Predicate<NoInfer<V>>): (self: TxHashSet<V>) => Effect.Effect<TxHashSet<V>>; // overload 2
export declare const filter: <V, U extends V>(self: TxHashSet<V>, refinement: Refinement<V, U>): Effect.Effect<TxHashSet<U>>; // overload 3
export declare const filter: <V>(self: TxHashSet<V>, predicate: Predicate<V>): Effect.Effect<TxHashSet<V>>; // overload 4
export declare const fromHashSet: <V>(hashSet: HashSet.HashSet<V>): Effect.Effect<TxHashSet<V>>;
export declare const fromIterable: <V>(values: Iterable<V>): Effect.Effect<TxHashSet<V>>;
export declare const has: <V>(value: V): (self: TxHashSet<V>) => Effect.Effect<boolean>; // overload 1
export declare const has: <V>(self: TxHashSet<V>, value: V): Effect.Effect<boolean>; // overload 2
export declare const intersection: <V1>(that: TxHashSet<V1>): <V0>(self: TxHashSet<V0>) => Effect.Effect<TxHashSet<V1 & V0>>; // overload 1
export declare const intersection: <V0, V1>(self: TxHashSet<V0>, that: TxHashSet<V1>): Effect.Effect<TxHashSet<V0 & V1>>; // overload 2
export declare const isEmpty: <V>(self: TxHashSet<V>): Effect.Effect<boolean>;
export declare const isSubset: <V1>(that: TxHashSet<V1>): <V0>(self: TxHashSet<V0>) => Effect.Effect<boolean>; // overload 1
export declare const isSubset: <V0, V1>(self: TxHashSet<V0>, that: TxHashSet<V1>): Effect.Effect<boolean>; // overload 2
export declare const isTxHashSet: (u: unknown): u is TxHashSet<unknown>;
export declare const make: <Values extends ReadonlyArray<any>>(...values: Values): Effect.Effect<TxHashSet<Values[number]>>;
export declare const map: <V, U>(f: (value: V) => U): (self: TxHashSet<V>) => Effect.Effect<TxHashSet<U>>; // overload 1
export declare const map: <V, U>(self: TxHashSet<V>, f: (value: V) => U): Effect.Effect<TxHashSet<U>>; // overload 2
export declare const reduce: <V, U>(zero: U, f: (accumulator: U, value: V) => U): (self: TxHashSet<V>) => Effect.Effect<U>; // overload 1
export declare const reduce: <V, U>(self: TxHashSet<V>, zero: U, f: (accumulator: U, value: V) => U): Effect.Effect<U>; // overload 2
export declare const remove: <V>(value: V): (self: TxHashSet<V>) => Effect.Effect<boolean>; // overload 1
export declare const remove: <V>(self: TxHashSet<V>, value: V): Effect.Effect<boolean>; // overload 2
export declare const size: <V>(self: TxHashSet<V>): Effect.Effect<number>;
export declare const some: <V>(predicate: Predicate<V>): (self: TxHashSet<V>) => Effect.Effect<boolean>; // overload 1
export declare const some: <V>(self: TxHashSet<V>, predicate: Predicate<V>): Effect.Effect<boolean>; // overload 2
export declare const toHashSet: <V>(self: TxHashSet<V>): Effect.Effect<HashSet.HashSet<V>>;
export declare const union: <V1>(that: TxHashSet<V1>): <V0>(self: TxHashSet<V0>) => Effect.Effect<TxHashSet<V1 | V0>>; // overload 1
export declare const union: <V0, V1>(self: TxHashSet<V0>, that: TxHashSet<V1>): Effect.Effect<TxHashSet<V0 | V1>>; // overload 2
```

## Other Exports (Non-Function)

- `TxHashSet` (interface)
