# API Reference: effect/TxQueue

- Import path: `effect/TxQueue`
- Source file: `packages/effect/src/TxQueue.ts`
- Function exports (callable): 29
- Non-function exports: 5

## Purpose

TxQueue is a transactional queue data structure that provides Software Transactional Memory (STM) semantics for queue operations. It uses TxRef for transactional state management and supports multiple queue strategies: bounded, unbounded, dropping, and sliding.

## Key Function Exports

- `awaitCompletion`
- `bounded`
- `clear`
- `dropping`
- `end`
- `fail`
- `failCause`
- `interrupt`
- `isClosing`
- `isDone`
- `isEmpty`
- `isFull`
- `isOpen`
- `isShutdown`
- `isTxDequeue`
- `isTxEnqueue`
- `isTxQueue`
- `offer`

## All Function Signatures

```ts
export declare const awaitCompletion: (self: TxQueueState): Effect.Effect<void>;
export declare const bounded: <A = never, E = never>(capacity: number): Effect.Effect<TxQueue<A, E>>;
export declare const clear: <A, E>(self: TxEnqueue<A, E>): Effect.Effect<Array<A>, ExcludeDone<E>>;
export declare const dropping: <A = never, E = never>(capacity: number): Effect.Effect<TxQueue<A, E>>;
export declare const end: <A, E>(self: TxEnqueue<A, E | Cause.Done>): Effect.Effect<boolean>;
export declare const fail: <E>(error: E): <A>(self: TxEnqueue<A, E>) => Effect.Effect<boolean>; // overload 1
export declare const fail: <A, E>(self: TxEnqueue<A, E>, error: E): Effect.Effect<boolean>; // overload 2
export declare const failCause: <E>(cause: Cause.Cause<E>): <A>(self: TxEnqueue<A, E>) => Effect.Effect<boolean>; // overload 1
export declare const failCause: <A, E>(self: TxEnqueue<A, E>, cause: Cause.Cause<E>): Effect.Effect<boolean>; // overload 2
export declare const interrupt: <A, E>(self: TxEnqueue<A, E>): Effect.Effect<boolean>;
export declare const isClosing: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isDone: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isEmpty: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isFull: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isOpen: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isShutdown: (self: TxQueueState): Effect.Effect<boolean>;
export declare const isTxDequeue: <A = unknown, E = unknown>(u: unknown): u is TxDequeue<A, E>;
export declare const isTxEnqueue: <A = unknown, E = unknown>(u: unknown): u is TxEnqueue<A, E>;
export declare const isTxQueue: <A = unknown, E = unknown>(u: unknown): u is TxQueue<A, E>;
export declare const offer: <A, E>(value: A): (self: TxEnqueue<A, E>) => Effect.Effect<boolean>; // overload 1
export declare const offer: <A, E>(self: TxEnqueue<A, E>, value: A): Effect.Effect<boolean>; // overload 2
export declare const offerAll: <A, E>(values: Iterable<A>): (self: TxEnqueue<A, E>) => Effect.Effect<Array<A>>; // overload 1
export declare const offerAll: <A, E>(self: TxEnqueue<A, E>, values: Iterable<A>): Effect.Effect<Array<A>>; // overload 2
export declare const peek: <A, E>(self: TxDequeue<A, E>): Effect.Effect<A, E>;
export declare const poll: <A, E>(self: TxDequeue<A, E>): Effect.Effect<Option.Option<A>>;
export declare const shutdown: <A, E>(self: TxEnqueue<A, E>): Effect.Effect<boolean>;
export declare const size: (self: TxQueueState): Effect.Effect<number>;
export declare const sliding: <A = never, E = never>(capacity: number): Effect.Effect<TxQueue<A, E>>;
export declare const take: <A, E>(self: TxDequeue<A, E>): Effect.Effect<A, E>;
export declare const takeAll: <A, E>(self: TxDequeue<A, E>): Effect.Effect<Arr.NonEmptyArray<A>, E>;
export declare const takeBetween: (min: number, max: number): <A, E>(self: TxDequeue<A, E>) => Effect.Effect<Array<A>, E>; // overload 1
export declare const takeBetween: <A, E>(self: TxDequeue<A, E>, min: number, max: number): Effect.Effect<Array<A>, E>; // overload 2
export declare const takeN: (n: number): <A, E>(self: TxDequeue<A, E>) => Effect.Effect<Array<A>, E>; // overload 1
export declare const takeN: <A, E>(self: TxDequeue<A, E>, n: number): Effect.Effect<Array<A>, E>; // overload 2
export declare const unbounded: <A = never, E = never>(): Effect.Effect<TxQueue<A, E>>;
```

## Other Exports (Non-Function)

- `State` (type)
- `TxDequeue` (interface)
- `TxEnqueue` (interface)
- `TxQueue` (interface)
- `TxQueueState` (interface)
