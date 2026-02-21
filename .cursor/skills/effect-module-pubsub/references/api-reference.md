# API Reference: effect/PubSub

- Import path: `effect/PubSub`
- Source file: `packages/effect/src/PubSub.ts`
- Function exports (callable): 26
- Non-function exports: 5

## Purpose

This module provides utilities for working with publish-subscribe (PubSub) systems.

## Key Function Exports

- `awaitShutdown`
- `bounded`
- `capacity`
- `dropping`
- `isEmpty`
- `isFull`
- `isShutdown`
- `isShutdownUnsafe`
- `make`
- `makeAtomicBounded`
- `makeAtomicUnbounded`
- `publish`
- `publishAll`
- `publishUnsafe`
- `remaining`
- `remainingUnsafe`
- `shutdown`
- `size`

## All Function Signatures

```ts
export declare const awaitShutdown: <A>(self: PubSub<A>): Effect.Effect<void>;
export declare const bounded: <A>(capacity: number | { readonly capacity: number; readonly replay?: number | undefined; }): Effect.Effect<PubSub<A>>;
export declare const capacity: <A>(self: PubSub<A>): number;
export declare const dropping: <A>(capacity: number | { readonly capacity: number; readonly replay?: number | undefined; }): Effect.Effect<PubSub<A>>;
export declare const isEmpty: <A>(self: PubSub<A>): Effect.Effect<boolean>;
export declare const isFull: <A>(self: PubSub<A>): Effect.Effect<boolean>;
export declare const isShutdown: <A>(self: PubSub<A>): Effect.Effect<boolean>;
export declare const isShutdownUnsafe: <A>(self: PubSub<A>): boolean;
export declare const make: <A>(options: { readonly atomicPubSub: LazyArg<PubSub.Atomic<A>>; readonly strategy: LazyArg<PubSub.Strategy<A>>; }): Effect.Effect<PubSub<A>>;
export declare const makeAtomicBounded: <A>(capacity: number | { readonly capacity: number; readonly replay?: number | undefined; }): PubSub.Atomic<A>;
export declare const makeAtomicUnbounded: <A>(options?: { readonly replay?: number | undefined; }): PubSub.Atomic<A>;
export declare const publish: <A>(value: A): (self: PubSub<A>) => Effect.Effect<boolean>; // overload 1
export declare const publish: <A>(self: PubSub<A>, value: A): Effect.Effect<boolean>; // overload 2
export declare const publishAll: <A>(elements: Iterable<A>): (self: PubSub<A>) => Effect.Effect<boolean>; // overload 1
export declare const publishAll: <A>(self: PubSub<A>, elements: Iterable<A>): Effect.Effect<boolean>; // overload 2
export declare const publishUnsafe: <A>(value: A): (self: PubSub<A>) => boolean; // overload 1
export declare const publishUnsafe: <A>(self: PubSub<A>, value: A): boolean; // overload 2
export declare const remaining: <A>(self: Subscription<A>): Effect.Effect<number>;
export declare const remainingUnsafe: <A>(self: Subscription<A>): number | undefined;
export declare const shutdown: <A>(self: PubSub<A>): Effect.Effect<void>;
export declare const size: <A>(self: PubSub<A>): Effect.Effect<number>;
export declare const sizeUnsafe: <A>(self: PubSub<A>): number;
export declare const sliding: <A>(capacity: number | { readonly capacity: number; readonly replay?: number | undefined; }): Effect.Effect<PubSub<A>>;
export declare const subscribe: <A>(self: PubSub<A>): Effect.Effect<Subscription<A>, never, Scope.Scope>;
export declare const take: <A>(self: Subscription<A>): Effect.Effect<A>;
export declare const takeAll: <A>(self: Subscription<A>): Effect.Effect<Arr.NonEmptyArray<A>>;
export declare const takeBetween: (min: number, max: number): <A>(self: Subscription<A>) => Effect.Effect<Array<A>>; // overload 1
export declare const takeBetween: <A>(self: Subscription<A>, min: number, max: number): Effect.Effect<Array<A>>; // overload 2
export declare const takeUpTo: (max: number): <A>(self: Subscription<A>) => Effect.Effect<Array<A>>; // overload 1
export declare const takeUpTo: <A>(self: Subscription<A>, max: number): Effect.Effect<Array<A>>; // overload 2
export declare const unbounded: <A>(options?: { readonly replay?: number | undefined; }): Effect.Effect<PubSub<A>>;
```

## Other Exports (Non-Function)

- `BackPressureStrategy` (class)
- `DroppingStrategy` (class)
- `PubSub` (interface)
- `SlidingStrategy` (class)
- `Subscription` (interface)
