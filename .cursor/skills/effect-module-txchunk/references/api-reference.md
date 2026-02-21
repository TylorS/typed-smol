# API Reference: effect/TxChunk

- Import path: `effect/TxChunk`
- Source file: `packages/effect/src/TxChunk.ts`
- Function exports (callable): 21
- Non-function exports: 1

## Purpose

TxChunk is a transactional chunk data structure that provides Software Transactional Memory (STM) semantics for chunk operations. It uses a `TxRef<Chunk<A>>` internally to ensure all operations are performed atomically within transactions.

## Key Function Exports

- `append`
- `appendAll`
- `concat`
- `drop`
- `empty`
- `filter`
- `fromIterable`
- `get`
- `isEmpty`
- `isNonEmpty`
- `make`
- `makeUnsafe`
- `map`
- `modify`
- `prepend`
- `prependAll`
- `set`
- `size`

## All Function Signatures

```ts
export declare const append: <A>(element: A): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const append: <A>(self: TxChunk<A>, element: A): Effect.Effect<void>; // overload 2
export declare const appendAll: <A>(other: Chunk.Chunk<A>): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const appendAll: <A>(self: TxChunk<A>, other: Chunk.Chunk<A>): Effect.Effect<void>; // overload 2
export declare const concat: <A>(other: TxChunk<A>): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const concat: <A>(self: TxChunk<A>, other: TxChunk<A>): Effect.Effect<void>; // overload 2
export declare const drop: (n: number): <A>(self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const drop: <A>(self: TxChunk<A>, n: number): Effect.Effect<void>; // overload 2
export declare const empty: <A = never>(): Effect.Effect<TxChunk<A>>;
export declare const filter: <A, B extends A>(refinement: (a: A) => a is B): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const filter: <A>(predicate: (a: A) => boolean): (self: TxChunk<A>) => Effect.Effect<void>; // overload 2
export declare const filter: <A, B extends A>(self: TxChunk<A>, refinement: (a: A) => a is B): Effect.Effect<void>; // overload 3
export declare const filter: <A>(self: TxChunk<A>, predicate: (a: A) => boolean): Effect.Effect<void>; // overload 4
export declare const fromIterable: <A>(iterable: Iterable<A>): Effect.Effect<TxChunk<A>>;
export declare const get: <A>(self: TxChunk<A>): Effect.Effect<Chunk.Chunk<A>>;
export declare const isEmpty: <A>(self: TxChunk<A>): Effect.Effect<boolean>;
export declare const isNonEmpty: <A>(self: TxChunk<A>): Effect.Effect<boolean>;
export declare const make: <A>(initial: Chunk.Chunk<A>): Effect.Effect<TxChunk<A>>;
export declare const makeUnsafe: <A>(ref: TxRef.TxRef<Chunk.Chunk<A>>): TxChunk<A>;
export declare const map: <A>(f: (a: NoInfer<A>) => A): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const map: <A>(self: TxChunk<A>, f: (a: A) => A): Effect.Effect<void>; // overload 2
export declare const modify: <A, R>(f: (current: Chunk.Chunk<NoInfer<A>>) => [returnValue: R, newValue: Chunk.Chunk<A>]): (self: TxChunk<A>) => Effect.Effect<R>; // overload 1
export declare const modify: <A, R>(self: TxChunk<A>, f: (current: Chunk.Chunk<A>) => [returnValue: R, newValue: Chunk.Chunk<A>]): Effect.Effect<R>; // overload 2
export declare const prepend: <A>(element: A): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const prepend: <A>(self: TxChunk<A>, element: A): Effect.Effect<void>; // overload 2
export declare const prependAll: <A>(other: Chunk.Chunk<A>): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const prependAll: <A>(self: TxChunk<A>, other: Chunk.Chunk<A>): Effect.Effect<void>; // overload 2
export declare const set: <A>(chunk: Chunk.Chunk<A>): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const set: <A>(self: TxChunk<A>, chunk: Chunk.Chunk<A>): Effect.Effect<void>; // overload 2
export declare const size: <A>(self: TxChunk<A>): Effect.Effect<number>;
export declare const slice: (start: number, end: number): <A>(self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const slice: <A>(self: TxChunk<A>, start: number, end: number): Effect.Effect<void>; // overload 2
export declare const take: (n: number): <A>(self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const take: <A>(self: TxChunk<A>, n: number): Effect.Effect<void>; // overload 2
export declare const update: <A>(f: (current: Chunk.Chunk<NoInfer<A>>) => Chunk.Chunk<A>): (self: TxChunk<A>) => Effect.Effect<void>; // overload 1
export declare const update: <A>(self: TxChunk<A>, f: (current: Chunk.Chunk<A>) => Chunk.Chunk<A>): Effect.Effect<void>; // overload 2
```

## Other Exports (Non-Function)

- `TxChunk` (interface)
