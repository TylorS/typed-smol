# API Reference: effect/Queue

- Import path: `effect/Queue`
- Source file: `packages/effect/src/Queue.ts`
- Function exports (callable): 36
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `asDequeue`
- `asEnqueue`
- `await`
- `bounded`
- `clear`
- `collect`
- `dropping`
- `end`
- `endUnsafe`
- `fail`
- `failCause`
- `failCauseUnsafe`
- `interrupt`
- `into`
- `isDequeue`
- `isEnqueue`
- `isFull`
- `isFullUnsafe`

## All Function Signatures

```ts
export declare const asDequeue: <A, E>(self: Queue<A, E>): Dequeue<A, E>;
export declare const asEnqueue: <A, E>(self: Queue<A, E>): Enqueue<A, E>;
export declare const await: <A, E>(self: Dequeue<A, E>): Effect<void, Exclude<E, Done>>;
export declare const bounded: <A, E = never>(capacity: number): Effect<Queue<A, E>>;
export declare const clear: <A, E>(self: Dequeue<A, E>): Effect<Array<A>, Pull.ExcludeDone<E>>;
export declare const collect: <A, E>(self: Dequeue<A, E | Done>): Effect<Array<A>, Pull.ExcludeDone<E>>;
export declare const dropping: <A, E = never>(capacity: number): Effect<Queue<A, E>>;
export declare const end: <A, E>(self: Enqueue<A, E | Done>): Effect<boolean>;
export declare const endUnsafe: <A, E>(self: Enqueue<A, E | Done>): boolean;
export declare const fail: <A, E>(self: Queue<A, E>, error: E): Effect<boolean, never, never>;
export declare const failCause: <E>(cause: Cause<E>): <A>(self: Enqueue<A, E>) => Effect<boolean>; // overload 1
export declare const failCause: <A, E>(self: Enqueue<A, E>, cause: Cause<E>): Effect<boolean>; // overload 2
export declare const failCauseUnsafe: <A, E>(self: Enqueue<A, E>, cause: Cause<E>): boolean;
export declare const interrupt: <A, E>(self: Enqueue<A, E>): Effect<boolean>;
export declare const into: <A, E>(self: Enqueue<A, E | Done>): <AX, EX extends E, RX>(effect: Effect<AX, EX, RX>) => Effect<boolean, never, RX>; // overload 1
export declare const into: <AX, E, EX extends E, RX, A>(effect: Effect<AX, EX, RX>, self: Enqueue<A, E | Done>): Effect<boolean, never, RX>; // overload 2
export declare const isDequeue: <A = unknown, E = unknown>(u: unknown): u is Dequeue<A, E>;
export declare const isEnqueue: <A = unknown, E = unknown>(u: unknown): u is Enqueue<A, E>;
export declare const isFull: <A, E>(self: Dequeue<A, E>): Effect<boolean>;
export declare const isFullUnsafe: <A, E>(self: Dequeue<A, E>): boolean;
export declare const isQueue: <A = unknown, E = unknown>(u: unknown): u is Queue<A, E>;
export declare const make: <A, E = never>(options?: { readonly capacity?: number | undefined; readonly strategy?: "suspend" | "dropping" | "sliding" | undefined; } | undefined): Effect<Queue<A, E>>;
export declare const offer: <A, E>(self: Enqueue<A, E>, message: Types.NoInfer<A>): Effect<boolean>;
export declare const offerAll: <A, E>(self: Enqueue<A, E>, messages: Iterable<A>): Effect<Array<A>>;
export declare const offerAllUnsafe: <A, E>(self: Enqueue<A, E>, messages: Iterable<A>): Array<A>;
export declare const offerUnsafe: <A, E>(self: Enqueue<A, E>, message: Types.NoInfer<A>): boolean;
export declare const peek: <A, E>(self: Dequeue<A, E>): Effect<A, E>;
export declare const poll: <A, E>(self: Dequeue<A, E>): Effect<Option.Option<A>>;
export declare const shutdown: <A, E>(self: Enqueue<A, E>): Effect<boolean>;
export declare const size: <A, E>(self: Dequeue<A, E>): Effect<number>;
export declare const sizeUnsafe: <A, E>(self: Dequeue<A, E>): number;
export declare const sliding: <A, E = never>(capacity: number): Effect<Queue<A, E>>;
export declare const take: <A, E>(self: Dequeue<A, E>): Effect<A, E>;
export declare const takeAll: <A, E>(self: Dequeue<A, E>): Effect<Arr.NonEmptyArray<A>, E>;
export declare const takeBetween: <A, E>(self: Dequeue<A, E>, min: number, max: number): Effect<Array<A>, E>;
export declare const takeN: <A, E>(self: Dequeue<A, E>, n: number): Effect<Array<A>, E>;
export declare const takeUnsafe: <A, E>(self: Dequeue<A, E>): Exit<A, E> | undefined;
export declare const unbounded: <A, E = never>(): Effect<Queue<A, E>>;
```

## Other Exports (Non-Function)

- `Dequeue` (interface)
- `Enqueue` (interface)
- `Queue` (interface)
