# API Reference: effect/HashRing

- Import path: `effect/HashRing`
- Source file: `packages/effect/src/HashRing.ts`
- Function exports (callable): 8
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `addMany`
- `get`
- `getShards`
- `has`
- `isHashRing`
- `make`
- `remove`

## All Function Signatures

```ts
export declare const add: <A extends PrimaryKey.PrimaryKey>(node: A, options?: { readonly weight?: number | undefined; }): (self: HashRing<A>) => HashRing<A>; // overload 1
export declare const add: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A, options?: { readonly weight?: number | undefined; }): HashRing<A>; // overload 2
export declare const addMany: <A extends PrimaryKey.PrimaryKey>(nodes: Iterable<A>, options?: { readonly weight?: number | undefined; }): (self: HashRing<A>) => HashRing<A>; // overload 1
export declare const addMany: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, nodes: Iterable<A>, options?: { readonly weight?: number | undefined; }): HashRing<A>; // overload 2
export declare const get: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, input: string): A | undefined;
export declare const getShards: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, count: number): Array<A> | undefined;
export declare const has: <A extends PrimaryKey.PrimaryKey>(node: A): (self: HashRing<A>) => boolean; // overload 1
export declare const has: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A): boolean; // overload 2
export declare const isHashRing: (u: unknown): u is HashRing<any>;
export declare const make: <A extends PrimaryKey.PrimaryKey>(options?: { readonly baseWeight?: number | undefined; }): HashRing<A>;
export declare const remove: <A extends PrimaryKey.PrimaryKey>(node: A): (self: HashRing<A>) => HashRing<A>; // overload 1
export declare const remove: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A): HashRing<A>; // overload 2
```

## Other Exports (Non-Function)

- `HashRing` (interface)
