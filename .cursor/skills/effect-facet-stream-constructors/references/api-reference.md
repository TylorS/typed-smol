# API Reference: effect/Stream#constructors

- Import path: `effect/Stream#constructors`
- Source file: `packages/effect/src/Stream.ts`
- Thematic facet: `constructors`
- Function exports (callable): 27
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fail`
- `failCause`
- `failCauseSync`
- `failSync`
- `fromArray`
- `fromArrayEffect`
- `fromArrays`
- `fromAsyncIterable`
- `fromChannel`
- `fromEffect`
- `fromEffectDrain`
- `fromEffectRepeat`
- `fromEffectSchedule`
- `fromEventListener`
- `fromIterable`
- `fromIterableEffect`
- `fromIterableEffectRepeat`
- `fromIteratorSucceed`

## All Function Signatures

```ts
export declare const fail: <E>(error: E): Stream<never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Stream<never, E>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Stream<never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Stream<never, E>;
export declare const fromArray: <A>(array: ReadonlyArray<A>): Stream<A>;
export declare const fromArrayEffect: <A, E, R>(effect: Effect.Effect<ReadonlyArray<A>, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromArrays: <Arr extends ReadonlyArray<ReadonlyArray<any>>>(...arrays: Arr): Stream<Arr[number][number]>;
export declare const fromAsyncIterable: <A, E>(iterable: AsyncIterable<A>, onError: (error: unknown) => E): Stream<A, E>;
export declare const fromChannel: <Arr extends Arr.NonEmptyReadonlyArray<any>, E, R>(channel: Channel.Channel<Arr, E, void, unknown, unknown, unknown, R>): Stream<Arr extends Arr.NonEmptyReadonlyArray<infer A> ? A : never, E, R>;
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<A, E, R>;
export declare const fromEffectDrain: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<never, E, R>;
export declare const fromEffectRepeat: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromEffectSchedule: <A, E, R, X, AS extends A, ES, RS>(effect: Effect.Effect<A, E, R>, schedule: Schedule.Schedule<X, AS, ES, RS>): Stream<A, E | ES, R | RS>;
export declare const fromEventListener: <A = unknown>(target: EventListener<A>, type: string, options?: boolean | { readonly capture?: boolean; readonly passive?: boolean; readonly once?: boolean; readonly bufferSize?: number | undefined; } | undefined): Stream<A>;
export declare const fromIterable: <A>(iterable: Iterable<A>): Stream<A>;
export declare const fromIterableEffect: <A, E, R>(iterable: Effect.Effect<Iterable<A>, E, R>): Stream<A, E, R>;
export declare const fromIterableEffectRepeat: <A, E, R>(iterable: Effect.Effect<Iterable<A>, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromIteratorSucceed: <A>(iterator: IterableIterator<A>, maxChunkSize?: number): Stream<A>;
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Stream<A>;
export declare const fromPubSubTake: <A, E>(pubsub: PubSub.PubSub<Take.Take<A, E>>): Stream<A, E>;
export declare const fromPull: <A, E, R, EX, RX>(pull: Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void, R>, EX, RX>): Stream<A, Pull.ExcludeDone<E> | EX, R | RX>;
export declare const fromQueue: <A, E>(queue: Queue.Dequeue<A, E>): Stream<A, Exclude<E, Cause.Done>>;
export declare const fromReadableStream: <A, E>(options: { readonly evaluate: LazyArg<ReadableStream<A>>; readonly onError: (error: unknown) => E; readonly releaseLockOnEnd?: boolean | undefined; }): Stream<A, E>;
export declare const fromSchedule: <O, E, R>(schedule: Schedule.Schedule<O, unknown, E, R>): Stream<O, E, R>;
export declare const fromSubscription: <A>(pubsub: PubSub.Subscription<A>): Stream<A>;
export declare const make: <const As extends ReadonlyArray<any>>(...values: As): Stream<As[number]>;
export declare const succeed: <A>(value: A): Stream<A>;
```

## Other Exports (Non-Function)

- `empty` (variable)
