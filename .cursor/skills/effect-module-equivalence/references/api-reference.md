# API Reference: effect/Equivalence

- Import path: `effect/Equivalence`
- Source file: `packages/effect/src/Equivalence.ts`
- Function exports (callable): 14
- Non-function exports: 2

## Purpose

Utilities for defining equivalence relations - binary relations that determine when two values should be considered equivalent. Equivalence relations are used for comparing, deduplicating, and organizing data in collections and data structures.

## Key Function Exports

- `Array`
- `BigInt`
- `Boolean`
- `combine`
- `combineAll`
- `make`
- `makeReducer`
- `mapInput`
- `Number`
- `Record`
- `strictEqual`
- `String`
- `Struct`
- `Tuple`

## All Function Signatures

```ts
export declare const Array: <A>(item: Equivalence<A>): Equivalence<ReadonlyArray<A>>;
export declare const BigInt: (self: bigint, that: bigint): boolean;
export declare const Boolean: (self: boolean, that: boolean): boolean;
export declare const combine: <A>(that: Equivalence<A>): (self: Equivalence<A>) => Equivalence<A>; // overload 1
export declare const combine: <A>(self: Equivalence<A>, that: Equivalence<A>): Equivalence<A>; // overload 2
export declare const combineAll: <A>(collection: Iterable<Equivalence<A>>): Equivalence<A>;
export declare const make: <A>(isEquivalent: (self: A, that: A) => boolean): Equivalence<A>;
export declare const makeReducer: <A>(): Reducer.Reducer<Equivalence<A>>;
export declare const mapInput: <B, A>(f: (b: B) => A): (self: Equivalence<A>) => Equivalence<B>; // overload 1
export declare const mapInput: <A, B>(self: Equivalence<A>, f: (b: B) => A): Equivalence<B>; // overload 2
export declare const Number: (self: number, that: number): boolean;
export declare const Record: <A>(value: Equivalence<A>): Equivalence<Record<PropertyKey, A>>;
export declare const strictEqual: <A>(): Equivalence<A>;
export declare const String: (self: string, that: string): boolean;
export declare const Struct: <R extends Record<string, Equivalence<any>>>(fields: R): Equivalence<{ readonly [K in keyof R]: [R[K]] extends [Equivalence<infer A>] ? A : never; }>;
export declare const Tuple: <const Elements extends ReadonlyArray<Equivalence<any>>>(elements: Elements): Equivalence<{ readonly [I in keyof Elements]: [Elements[I]] extends [Equivalence<infer A>] ? A : never; }>;
```

## Other Exports (Non-Function)

- `Equivalence` (type)
- `EquivalenceTypeLambda` (interface)
