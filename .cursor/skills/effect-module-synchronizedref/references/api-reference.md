# API Reference: effect/SynchronizedRef

- Import path: `effect/SynchronizedRef`
- Source file: `packages/effect/src/SynchronizedRef.ts`
- Function exports (callable): 23
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `get`
- `getAndSet`
- `getAndUpdate`
- `getAndUpdateEffect`
- `getAndUpdateSome`
- `getAndUpdateSomeEffect`
- `getUnsafe`
- `make`
- `makeUnsafe`
- `modify`
- `modifyEffect`
- `modifySome`
- `modifySomeEffect`
- `set`
- `setAndGet`
- `update`
- `updateAndGet`
- `updateAndGetEffect`

## All Function Signatures

```ts
export declare const get: <A>(self: SynchronizedRef<A>): Effect.Effect<A>;
export declare const getAndSet: <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndSet: <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<A>; // overload 2
export declare const getAndUpdate: <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdate: <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const getAndUpdateEffect: <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const getAndUpdateEffect: <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const getAndUpdateSome: <A>(pf: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdateSome: <A>(self: SynchronizedRef<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
export declare const getAndUpdateSomeEffect: <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const getAndUpdateSomeEffect: <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const getUnsafe: <A>(self: SynchronizedRef<A>): A;
export declare const make: <A>(value: A): Effect.Effect<SynchronizedRef<A>>;
export declare const makeUnsafe: <A>(value: A): SynchronizedRef<A>;
export declare const modify: <A, B>(f: (a: A) => readonly [B, A]): (self: SynchronizedRef<A>) => Effect.Effect<B>; // overload 1
export declare const modify: <A, B>(self: SynchronizedRef<A>, f: (a: A) => readonly [B, A]): Effect.Effect<B>; // overload 2
export declare const modifyEffect: <A, B, E, R>(f: (a: A) => Effect.Effect<readonly [B, A], E, R>): (self: SynchronizedRef<A>) => Effect.Effect<B, E, R>; // overload 1
export declare const modifyEffect: <A, B, E, R>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<readonly [B, A], E, R>): Effect.Effect<B, E, R>; // overload 2
export declare const modifySome: <B, A>(pf: (a: A) => readonly [B, Option.Option<A>]): (self: SynchronizedRef<A>) => Effect.Effect<B>; // overload 1
export declare const modifySome: <A, B>(self: SynchronizedRef<A>, pf: (a: A) => readonly [B, Option.Option<A>]): Effect.Effect<B>; // overload 2
export declare const modifySomeEffect: <A, B, R, E>(fallback: B, pf: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): (self: SynchronizedRef<A>) => Effect.Effect<B, E, R>; // overload 1
export declare const modifySomeEffect: <A, B, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): Effect.Effect<B, E, R>; // overload 2
export declare const set: <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<void>; // overload 1
export declare const set: <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<void>; // overload 2
export declare const setAndGet: <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const setAndGet: <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<A>; // overload 2
export declare const update: <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<void>; // overload 1
export declare const update: <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<void>; // overload 2
export declare const updateAndGet: <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const updateAndGet: <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const updateAndGetEffect: <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const updateAndGetEffect: <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const updateEffect: <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<void, E, R>; // overload 1
export declare const updateEffect: <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<void, E, R>; // overload 2
export declare const updateSome: <A>(f: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<void>; // overload 1
export declare const updateSome: <A>(self: SynchronizedRef<A>, f: (a: A) => Option.Option<A>): Effect.Effect<void>; // overload 2
export declare const updateSomeAndGet: <A>(pf: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<A>; // overload 1
export declare const updateSomeAndGet: <A>(self: SynchronizedRef<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
export declare const updateSomeAndGetEffect: <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const updateSomeAndGetEffect: <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const updateSomeEffect: <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<void, E, R>; // overload 1
export declare const updateSomeEffect: <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<void, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `SynchronizedRef` (interface)
