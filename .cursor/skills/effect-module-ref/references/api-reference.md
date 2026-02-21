# API Reference: effect/Ref

- Import path: `effect/Ref`
- Source file: `packages/effect/src/Ref.ts`
- Function exports (callable): 15
- Non-function exports: 1

## Purpose

This module provides utilities for working with mutable references in a functional context.

## Key Function Exports

- `get`
- `getAndSet`
- `getAndUpdate`
- `getAndUpdateSome`
- `getUnsafe`
- `make`
- `makeUnsafe`
- `modify`
- `modifySome`
- `set`
- `setAndGet`
- `update`
- `updateAndGet`
- `updateSome`
- `updateSomeAndGet`

## All Function Signatures

```ts
export declare const get: <A>(self: Ref<A>): Effect.Effect<A, never, never>;
export declare const getAndSet: <A>(value: A): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const getAndSet: <A>(self: Ref<A>, value: A): Effect.Effect<A>; // overload 2
export declare const getAndUpdate: <A>(f: (a: A) => A): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdate: <A>(self: Ref<A>, f: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const getAndUpdateSome: <A>(pf: (a: A) => Option.Option<A>): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdateSome: <A>(self: Ref<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
export declare const getUnsafe: <A>(self: Ref<A>): A;
export declare const make: <A>(value: A): Effect.Effect<Ref<A>>;
export declare const makeUnsafe: <A>(value: A): Ref<A>;
export declare const modify: <A, B>(f: (a: A) => readonly [B, A]): (self: Ref<A>) => Effect.Effect<B>; // overload 1
export declare const modify: <A, B>(self: Ref<A>, f: (a: A) => readonly [B, A]): Effect.Effect<B>; // overload 2
export declare const modifySome: <B, A>(pf: (a: A) => readonly [B, Option.Option<A>]): (self: Ref<A>) => Effect.Effect<B>; // overload 1
export declare const modifySome: <A, B>(self: Ref<A>, pf: (a: A) => readonly [B, Option.Option<A>]): Effect.Effect<B>; // overload 2
export declare const set: <A>(value: A): (self: Ref<A>) => Effect.Effect<void>; // overload 1
export declare const set: <A>(self: Ref<A>, value: A): Effect.Effect<void>; // overload 2
export declare const setAndGet: <A>(value: A): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const setAndGet: <A>(self: Ref<A>, value: A): Effect.Effect<A>; // overload 2
export declare const update: <A>(f: (a: A) => A): (self: Ref<A>) => Effect.Effect<void>; // overload 1
export declare const update: <A>(self: Ref<A>, f: (a: A) => A): Effect.Effect<void>; // overload 2
export declare const updateAndGet: <A>(f: (a: A) => A): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const updateAndGet: <A>(self: Ref<A>, f: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const updateSome: <A>(f: (a: A) => Option.Option<A>): (self: Ref<A>) => Effect.Effect<void>; // overload 1
export declare const updateSome: <A>(self: Ref<A>, f: (a: A) => Option.Option<A>): Effect.Effect<void>; // overload 2
export declare const updateSomeAndGet: <A>(pf: (a: A) => Option.Option<A>): (self: Ref<A>) => Effect.Effect<A>; // overload 1
export declare const updateSomeAndGet: <A>(self: Ref<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
```

## Other Exports (Non-Function)

- `Ref` (interface)
