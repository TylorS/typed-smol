# API Reference: effect/Tuple

- Import path: `effect/Tuple`
- Source file: `packages/effect/src/Tuple.ts`
- Function exports (callable): 17
- Non-function exports: 0

## Purpose

Utilities for creating, accessing, transforming, and comparing fixed-length arrays (tuples). Every function produces a new tuple — inputs are never mutated.

## Key Function Exports

- `appendElement`
- `appendElements`
- `evolve`
- `get`
- `isTupleOf`
- `isTupleOfAtLeast`
- `make`
- `makeCombiner`
- `makeEquivalence`
- `makeOrder`
- `makeReducer`
- `map`
- `mapOmit`
- `mapPick`
- `omit`
- `pick`
- `renameIndices`

## All Function Signatures

```ts
export declare const appendElement: <const E>(element: E): <const T extends ReadonlyArray<unknown>>(self: T) => [...T, E]; // overload 1
export declare const appendElement: <const T extends ReadonlyArray<unknown>, const E>(self: T, element: E): [...T, E]; // overload 2
export declare const appendElements: <const T2 extends ReadonlyArray<unknown>>(that: T2): <const T1 extends ReadonlyArray<unknown>>(self: T1) => [...T1, ...T2]; // overload 1
export declare const appendElements: <const T1 extends ReadonlyArray<unknown>, const T2 extends ReadonlyArray<unknown>>(self: T1, that: T2): [...T1, ...T2]; // overload 2
export declare const evolve: <const T extends ReadonlyArray<unknown>, const E extends Evolver<T>>(evolver: E): (self: T) => Evolved<T, E>; // overload 1
export declare const evolve: <const T extends ReadonlyArray<unknown>, const E extends Evolver<T>>(self: T, evolver: E): Evolved<T, E>; // overload 2
export declare const get: <const T extends ReadonlyArray<unknown>, I extends Indices<T> & keyof T>(index: I): (self: T) => T[I]; // overload 1
export declare const get: <const T extends ReadonlyArray<unknown>, I extends Indices<T> & keyof T>(self: T, index: I): T[I]; // overload 2
export declare const isTupleOf: <N extends number>(n: N): <T>(self: ReadonlyArray<T>) => self is TupleOf<N, T>; // overload 1
export declare const isTupleOf: <T, N extends number>(self: ReadonlyArray<T>, n: N): self is TupleOf<N, T>; // overload 2
export declare const isTupleOfAtLeast: <N extends number>(n: N): <T>(self: ReadonlyArray<T>) => self is TupleOfAtLeast<N, T>; // overload 1
export declare const isTupleOfAtLeast: <T, N extends number>(self: ReadonlyArray<T>, n: N): self is TupleOfAtLeast<N, T>; // overload 2
export declare const make: <Elements extends ReadonlyArray<unknown>>(...elements: Elements): Elements;
export declare const makeCombiner: <A extends ReadonlyArray<unknown>>(combiners: { readonly [K in keyof A]: Combiner.Combiner<A[K]>; }): Combiner.Combiner<A>;
export declare const makeEquivalence: <const Elements extends ReadonlyArray<Equivalence.Equivalence<any>>>(elements: Elements): Equivalence.Equivalence<{ readonly [I in keyof Elements]: [Elements[I]] extends [Equivalence.Equivalence<infer A>] ? A : never; }>;
export declare const makeOrder: <const Elements extends ReadonlyArray<order.Order<any>>>(elements: Elements): order.Order<{ readonly [I in keyof Elements]: [Elements[I]] extends [order.Order<infer A>] ? A : never; }>;
export declare const makeReducer: <A extends ReadonlyArray<unknown>>(reducers: { readonly [K in keyof A]: Reducer.Reducer<A[K]>; }): Reducer.Reducer<A>;
export declare const map: <L extends Lambda>(lambda: L): <const T extends ReadonlyArray<unknown>>(self: T) => { [K in keyof T]: Apply<L, T[K]>; }; // overload 1
export declare const map: <const T extends ReadonlyArray<unknown>, L extends Lambda>(self: T, lambda: L): { [K in keyof T]: Apply<L, T[K]>; }; // overload 2
export declare const mapOmit: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, L extends Lambda>(indices: I, lambda: L): (self: T) => { [K in keyof T]: K extends `${I[number]}` ? T[K] : Apply<L, T[K]>; }; // overload 1
export declare const mapOmit: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, L extends Lambda>(self: T, indices: I, lambda: L): { [K in keyof T]: K extends `${I[number]}` ? T[K] : Apply<L, T[K]>; }; // overload 2
export declare const mapPick: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, L extends Lambda>(indices: I, lambda: L): (self: T) => { [K in keyof T]: K extends `${I[number]}` ? Apply<L, T[K]> : T[K]; }; // overload 1
export declare const mapPick: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, L extends Lambda>(self: T, indices: I, lambda: L): { [K in keyof T]: K extends `${I[number]}` ? Apply<L, T[K]> : T[K]; }; // overload 2
export declare const omit: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(indices: I): (self: T) => OmitTuple<T, I[number]>; // overload 1
export declare const omit: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(self: T, indices: I): OmitTuple<T, I[number]>; // overload 2
export declare const pick: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(indices: I): (self: T) => PickTuple<T, I[number]>; // overload 1
export declare const pick: <const T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(self: T, indices: I): PickTuple<T, I[number]>; // overload 2
export declare const renameIndices: <const T extends ReadonlyArray<unknown>, const M extends { readonly [I in keyof T]?: `${keyof T & string}`; }>(mapping: M): (self: T) => { [I in keyof T]: I extends keyof M ? M[I] extends keyof T ? T[M[I]] : T[I] : T[I]; }; // overload 1
export declare const renameIndices: <const T extends ReadonlyArray<unknown>, const M extends { readonly [I in keyof T]?: `${keyof T & string}`; }>(self: T, mapping: M): { [I in keyof T]: I extends keyof M ? M[I] extends keyof T ? T[M[I]] : T[I] : T[I]; }; // overload 2
```

## Other Exports (Non-Function)

- None
