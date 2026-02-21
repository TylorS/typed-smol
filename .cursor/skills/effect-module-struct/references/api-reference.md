# API Reference: effect/Struct

- Import path: `effect/Struct`
- Source file: `packages/effect/src/Struct.ts`
- Function exports (callable): 18
- Non-function exports: 5

## Purpose

Utilities for creating, transforming, and comparing plain TypeScript objects (structs). Every function produces a new object — inputs are never mutated.

## Key Function Exports

- `assign`
- `evolve`
- `evolveEntries`
- `evolveKeys`
- `get`
- `keys`
- `lambda`
- `makeCombiner`
- `makeEquivalence`
- `makeOrder`
- `makeReducer`
- `map`
- `mapOmit`
- `mapPick`
- `omit`
- `pick`
- `Record`
- `renameKeys`

## All Function Signatures

```ts
export declare const assign: <O extends object>(that: O): <S extends object>(self: S) => Simplify<Assign<S, O>>; // overload 1
export declare const assign: <O extends object, S extends object>(self: S, that: O): Simplify<Assign<S, O>>; // overload 2
export declare const evolve: <S extends object, E extends Evolver<S>>(e: E): (self: S) => Evolved<S, E>; // overload 1
export declare const evolve: <S extends object, E extends Evolver<S>>(self: S, e: E): Evolved<S, E>; // overload 2
export declare const evolveEntries: <S extends object, E extends EntryEvolver<S>>(e: E): (self: S) => EntryEvolved<S, E>; // overload 1
export declare const evolveEntries: <S extends object, E extends EntryEvolver<S>>(self: S, e: E): EntryEvolved<S, E>; // overload 2
export declare const evolveKeys: <S extends object, E extends KeyEvolver<S>>(e: E): (self: S) => KeyEvolved<S, E>; // overload 1
export declare const evolveKeys: <S extends object, E extends KeyEvolver<S>>(self: S, e: E): KeyEvolved<S, E>; // overload 2
export declare const get: <S extends object, const K extends keyof S>(key: K): (self: S) => S[K]; // overload 1
export declare const get: <S extends object, const K extends keyof S>(self: S, key: K): S[K]; // overload 2
export declare const keys: <S extends object>(self: S): Array<(keyof S) & string>;
export declare const lambda: <L extends (a: any) => any>(f: (a: Parameters<L>[0]) => ReturnType<L>): L;
export declare const makeCombiner: <A>(combiners: { readonly [K in keyof A]: Combiner.Combiner<A[K]>; }, options?: { readonly omitKeyWhen?: ((a: A[keyof A]) => boolean) | undefined; }): Combiner.Combiner<A>;
export declare const makeEquivalence: <R extends Record<string, Equivalence.Equivalence<any>>>(fields: R): Equivalence.Equivalence<{ readonly [K in keyof R]: [R[K]] extends [Equivalence.Equivalence<infer A>] ? A : never; }>;
export declare const makeOrder: <const R extends { readonly [x: string]: order.Order<any>; }>(fields: R): order.Order<{ [K in keyof R]: [R[K]] extends [order.Order<infer A>] ? A : never; }>;
export declare const makeReducer: <A>(reducers: { readonly [K in keyof A]: Reducer.Reducer<A[K]>; }, options?: { readonly omitKeyWhen?: ((a: A[keyof A]) => boolean) | undefined; }): Reducer.Reducer<A>;
export declare const map: <L extends Lambda>(lambda: L): <S extends object>(self: S) => { [K in keyof S]: Apply<L, S[K]>; }; // overload 1
export declare const map: <S extends object, L extends Lambda>(self: S, lambda: L): { [K in keyof S]: Apply<L, S[K]>; }; // overload 2
export declare const mapOmit: <S extends object, const Keys extends ReadonlyArray<keyof S>, L extends Lambda>(keys: Keys, lambda: L): (self: S) => { [K in keyof S]: K extends Keys[number] ? S[K] : Apply<L, S[K]>; }; // overload 1
export declare const mapOmit: <S extends object, const Keys extends ReadonlyArray<keyof S>, L extends Lambda>(self: S, keys: Keys, lambda: L): { [K in keyof S]: K extends Keys[number] ? S[K] : Apply<L, S[K]>; }; // overload 2
export declare const mapPick: <S extends object, const Keys extends ReadonlyArray<keyof S>, L extends Lambda>(keys: Keys, lambda: L): (self: S) => { [K in keyof S]: K extends Keys[number] ? Apply<L, S[K]> : S[K]; }; // overload 1
export declare const mapPick: <S extends object, const Keys extends ReadonlyArray<keyof S>, L extends Lambda>(self: S, keys: Keys, lambda: L): { [K in keyof S]: K extends Keys[number] ? Apply<L, S[K]> : S[K]; }; // overload 2
export declare const omit: <S extends object, const Keys extends ReadonlyArray<keyof S>>(keys: Keys): (self: S) => Omit<S, Keys[number]>; // overload 1
export declare const omit: <S extends object, const Keys extends ReadonlyArray<keyof S>>(self: S, keys: Keys): Omit<S, Keys[number]>; // overload 2
export declare const pick: <S extends object, const Keys extends ReadonlyArray<keyof S>>(keys: Keys): (self: S) => Pick<S, Keys[number]>; // overload 1
export declare const pick: <S extends object, const Keys extends ReadonlyArray<keyof S>>(self: S, keys: Keys): Pick<S, Keys[number]>; // overload 2
export declare const Record: <const Keys extends ReadonlyArray<string | symbol>, Value>(keys: Keys, value: Value): Record<Keys[number], Value>;
export declare const renameKeys: <S extends object, const M extends { readonly [K in keyof S]?: PropertyKey; }>(mapping: M): (self: S) => { [K in keyof S as K extends keyof M ? M[K] extends PropertyKey ? M[K] : K : K]: S[K]; }; // overload 1
export declare const renameKeys: <S extends object, const M extends { readonly [K in keyof S]?: PropertyKey; }>(self: S, mapping: M): { [K in keyof S as K extends keyof M ? M[K] extends PropertyKey ? M[K] : K : K]: S[K]; }; // overload 2
```

## Other Exports (Non-Function)

- `Apply` (type)
- `Assign` (type)
- `Lambda` (interface)
- `Mutable` (type)
- `Simplify` (type)
