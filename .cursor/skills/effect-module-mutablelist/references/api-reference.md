# API Reference: effect/MutableList

- Import path: `effect/MutableList`
- Source file: `packages/effect/src/MutableList.ts`
- Function exports (callable): 16
- Non-function exports: 2

## Purpose

MutableList is an efficient, mutable linked list implementation optimized for high-throughput scenarios like logging, queuing, and streaming. It uses a bucket-based architecture where elements are stored in arrays (buckets) linked together, providing optimal performance for both append and prepend operations.

## Key Function Exports

- `append`
- `appendAll`
- `appendAllUnsafe`
- `clear`
- `filter`
- `make`
- `prepend`
- `prependAll`
- `prependAllUnsafe`
- `remove`
- `take`
- `takeAll`
- `takeN`
- `takeNVoid`
- `toArray`
- `toArrayN`

## All Function Signatures

```ts
export declare const append: <A>(self: MutableList<A>, message: A): void;
export declare const appendAll: <A>(self: MutableList<A>, messages: Iterable<A>): number;
export declare const appendAllUnsafe: <A>(self: MutableList<A>, messages: ReadonlyArray<A>, mutable?: boolean): number;
export declare const clear: <A>(self: MutableList<A>): void;
export declare const filter: <A>(self: MutableList<A>, f: (value: A, i: number) => boolean): void;
export declare const make: <A>(): MutableList<A>;
export declare const prepend: <A>(self: MutableList<A>, message: A): void;
export declare const prependAll: <A>(self: MutableList<A>, messages: Iterable<A>): void;
export declare const prependAllUnsafe: <A>(self: MutableList<A>, messages: ReadonlyArray<A>, mutable?: boolean): void;
export declare const remove: <A>(self: MutableList<A>, value: A): void;
export declare const take: <A>(self: MutableList<A>): Empty | A;
export declare const takeAll: <A>(self: MutableList<A>): Array<A>;
export declare const takeN: <A>(self: MutableList<A>, n: number): Array<A>;
export declare const takeNVoid: <A>(self: MutableList<A>, n: number): void;
export declare const toArray: <A>(self: MutableList<A>): Array<A>;
export declare const toArrayN: <A>(self: MutableList<A>, n: number): Array<A>;
```

## Other Exports (Non-Function)

- `Empty` (type)
- `MutableList` (interface)
