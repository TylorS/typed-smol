# API Reference: effect/SubscriptionRef

- Import path: `effect/SubscriptionRef`
- Source file: `packages/effect/src/SubscriptionRef.ts`
- Function exports (callable): 24
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `changes`
- `get`
- `getAndSet`
- `getAndUpdate`
- `getAndUpdateEffect`
- `getAndUpdateSome`
- `getAndUpdateSomeEffect`
- `getUnsafe`
- `isSubscriptionRef`
- `make`
- `modify`
- `modifyEffect`
- `modifySome`
- `modifySomeEffect`
- `set`
- `setAndGet`
- `update`
- `updateAndGet`

## All Function Signatures

```ts
export declare const changes: <A>(self: SubscriptionRef<A>): Stream.Stream<A>;
export declare const get: <A>(self: SubscriptionRef<A>): Effect.Effect<A>;
export declare const getAndSet: <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndSet: <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<A>; // overload 2
export declare const getAndUpdate: <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdate: <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const getAndUpdateEffect: <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const getAndUpdateEffect: <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const getAndUpdateSome: <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const getAndUpdateSome: <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
export declare const getAndUpdateSomeEffect: <A, R, E>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const getAndUpdateSomeEffect: <A, R, E>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const getUnsafe: <A>(self: SubscriptionRef<A>): A;
export declare const isSubscriptionRef: (u: unknown): u is SubscriptionRef<unknown>;
export declare const make: <A>(value: A): Effect.Effect<SubscriptionRef<A>>;
export declare const modify: <A, B>(modify: (a: A) => readonly [B, A]): (self: SubscriptionRef<A>) => Effect.Effect<B>; // overload 1
export declare const modify: <A, B>(self: SubscriptionRef<A>, f: (a: A) => readonly [B, A]): Effect.Effect<B>; // overload 2
export declare const modifyEffect: <B, A, E, R>(modify: (a: A) => Effect.Effect<readonly [B, A], E, R>): (self: SubscriptionRef<A>) => Effect.Effect<B, E, R>; // overload 1
export declare const modifyEffect: <A, B, E, R>(self: SubscriptionRef<A>, modify: (a: A) => Effect.Effect<readonly [B, A], E, R>): Effect.Effect<B, E, R>; // overload 2
export declare const modifySome: <B, A>(modify: (a: A) => readonly [B, Option.Option<A>]): (self: SubscriptionRef<A>) => Effect.Effect<B>; // overload 1
export declare const modifySome: <A, B>(self: SubscriptionRef<A>, modify: (a: A) => readonly [B, Option.Option<A>]): Effect.Effect<B>; // overload 2
export declare const modifySomeEffect: <A, B, R, E>(modify: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): (self: SubscriptionRef<A>) => Effect.Effect<B, E, R>; // overload 1
export declare const modifySomeEffect: <A, B, R, E>(self: SubscriptionRef<A>, modify: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): Effect.Effect<B, E, R>; // overload 2
export declare const set: <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<void>; // overload 1
export declare const set: <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<void>; // overload 2
export declare const setAndGet: <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const setAndGet: <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<A>; // overload 2
export declare const update: <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<void>; // overload 1
export declare const update: <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<void>; // overload 2
export declare const updateAndGet: <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const updateAndGet: <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<A>; // overload 2
export declare const updateAndGetEffect: <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const updateAndGetEffect: <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const updateEffect: <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<void, E, R>; // overload 1
export declare const updateEffect: <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<void, E, R>; // overload 2
export declare const updateSome: <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<void>; // overload 1
export declare const updateSome: <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<void>; // overload 2
export declare const updateSomeAndGet: <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<A>; // overload 1
export declare const updateSomeAndGet: <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<A>; // overload 2
export declare const updateSomeAndGetEffect: <A, E, R>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>; // overload 1
export declare const updateSomeAndGetEffect: <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>; // overload 2
export declare const updateSomeEffect: <A, E, R>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<void, E, R>; // overload 1
export declare const updateSomeEffect: <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<void, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `SubscriptionRef` (interface)
