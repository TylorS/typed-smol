# API Reference: effect/Stream#runtime

- Import path: `effect/Stream#runtime`
- Source file: `packages/effect/src/Stream.ts`
- Thematic facet: `runtime`
- Function exports (callable): 49
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `collect`
- `drain`
- `drainFork`
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
- `fromPubSub`

## All Function Signatures

```ts
export declare const collect: <A, E, R>(self: Stream<A, E, R>): Stream<Array<A>, E, R>;
export declare const drain: <A, E, R>(self: Stream<A, E, R>): Stream<never, E, R>;
export declare const drainFork: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const drainFork: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
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
export declare const run: <A2, A, L, E2, R2>(sink: Sink.Sink<A2, A, L, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<A2, E2 | E, R | R2>; // overload 1
export declare const run: <A, E, R, L, A2, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<A2, A, L, E2, R2>): Effect.Effect<A2, E | E2, R | R2>; // overload 2
export declare const runCollect: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Array<A>, E, R>;
export declare const runCount: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<number, E, R>;
export declare const runDrain: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<void, E, R>;
export declare const runFold: <Z, A>(initial: LazyArg<Z>, f: (acc: Z, a: A) => Z): <E, R>(self: Stream<A, E, R>) => Effect.Effect<Z, E, R>; // overload 1
export declare const runFold: <A, E, R, Z>(self: Stream<A, E, R>, initial: LazyArg<Z>, f: (acc: Z, a: A) => Z): Effect.Effect<Z, E, R>; // overload 2
export declare const runFoldEffect: <Z, A, EX, RX>(initial: LazyArg<Z>, f: (acc: Z, a: A) => Effect.Effect<Z, EX, RX>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<Z, E | EX, R | RX>; // overload 1
export declare const runFoldEffect: <A, E, R, Z, EX, RX>(self: Stream<A, E, R>, initial: LazyArg<Z>, f: (acc: Z, a: A) => Effect.Effect<Z, EX, RX>): Effect.Effect<Z, E | EX, R | RX>; // overload 2
export declare const runForEach: <A, X, E2, R2>(f: (a: A) => Effect.Effect<X, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEach: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Effect.Effect<X, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runForEachArray: <A, X, E2, R2>(f: (a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<X, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEachArray: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<X, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runForEachWhile: <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEachWhile: <A, E, R, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runHead: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Option.Option<A>, E, R>;
export declare const runIntoPubSub: <A>(pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E, R>; // overload 1
export declare const runIntoPubSub: <A, E, R>(self: Stream<A, E, R>, pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): Effect.Effect<void, never, R>; // overload 2
export declare const runIntoQueue: <A, E>(queue: Queue.Queue<A, E | Cause.Done>): <R>(self: Stream<A, E, R>) => Effect.Effect<void, never, R>; // overload 1
export declare const runIntoQueue: <A, E, R>(self: Stream<A, E, R>, queue: Queue.Queue<A, E | Cause.Done>): Effect.Effect<void, never, R>; // overload 2
export declare const runLast: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Option.Option<A>, E, R>;
export declare const runSum: <E, R>(self: Stream<number, E, R>): Effect.Effect<number, E, R>;
export declare const toAsyncIterable: <A, E>(self: Stream<A, E>): AsyncIterable<A>;
export declare const toAsyncIterableEffect: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<AsyncIterable<A>, never, R>;
export declare const toAsyncIterableWith: <XR>(services: ServiceMap.ServiceMap<XR>): <A, E, R extends XR>(self: Stream<A, E, R>) => AsyncIterable<A>; // overload 1
export declare const toAsyncIterableWith: <A, E, XR, R extends XR>(self: Stream<A, E, R>, services: ServiceMap.ServiceMap<XR>): AsyncIterable<A>; // overload 2
export declare const toChannel: <A, E, R>(stream: Stream<A, E, R>): Channel.Channel<Arr.NonEmptyReadonlyArray<A>, E, void, unknown, unknown, unknown, R>;
export declare const toPubSub: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 1
export declare const toPubSub: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
export declare const toPubSubTake: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 1
export declare const toPubSubTake: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 2
export declare const toPull: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E>, never, R | Scope.Scope>;
export declare const toQueue: (options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E | Cause.Done>, never, R | Scope.Scope>; // overload 1
export declare const toQueue: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
export declare const toReadableStream: <A>(options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E>(self: Stream<A, E>) => ReadableStream<A>; // overload 1
export declare const toReadableStream: <A, E>(self: Stream<A, E>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): ReadableStream<A>; // overload 2
export declare const toReadableStreamEffect: <A>(options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<ReadableStream<A>, never, R>; // overload 1
export declare const toReadableStreamEffect: <A, E, R>(self: Stream<A, E, R>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): Effect.Effect<ReadableStream<A>, never, R>; // overload 2
export declare const toReadableStreamWith: <A, XR>(services: ServiceMap.ServiceMap<XR>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E, R extends XR>(self: Stream<A, E, R>) => ReadableStream<A>; // overload 1
export declare const toReadableStreamWith: <A, E, XR, R extends XR>(self: Stream<A, E, R>, services: ServiceMap.ServiceMap<XR>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): ReadableStream<A>; // overload 2
```

## Other Exports (Non-Function)

- `DefaultChunkSize` (variable)
- `Do` (variable)
- `empty` (variable)
- `Error` (type)
- `EventListener` (interface)
- `HaltStrategy` (type)
- `never` (variable)
- `Services` (type)
- `Stream` (interface)
- `StreamTypeLambda` (interface)
- `StreamUnify` (interface)
- `StreamUnifyIgnore` (interface)
- `Success` (type)
- `Variance` (interface)
- `VarianceStruct` (interface)
