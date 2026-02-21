# API Reference: effect/Channel#core

- Import path: `effect/Channel#core`
- Source file: `packages/effect/src/Channel.ts`
- Thematic facet: `core`
- Function exports (callable): 43
- Non-function exports: 10

## Purpose

The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## Key Function Exports

- `fromArray`
- `fromAsyncIterable`
- `fromAsyncIterableArray`
- `fromChunk`
- `fromEffect`
- `fromEffectDone`
- `fromEffectDrain`
- `fromEffectTake`
- `fromIterable`
- `fromIterableArray`
- `fromIterator`
- `fromIteratorArray`
- `fromPubSub`
- `fromPubSubArray`
- `fromPubSubTake`
- `fromPull`
- `fromQueue`
- `fromQueueArray`

## All Function Signatures

```ts
export declare const fromArray: <A>(array: ReadonlyArray<A>): Channel<A>;
export declare const fromAsyncIterable: <A, D, E>(iterable: AsyncIterable<A, D>, onError: (error: unknown) => E): Channel<A, E, D>;
export declare const fromAsyncIterableArray: <A, D, E>(iterable: AsyncIterable<A, D>, onError: (error: unknown) => E): Channel<Arr.NonEmptyReadonlyArray<A>, E, D>;
export declare const fromChunk: <A>(chunk: Chunk.Chunk<A>): Channel<A>;
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>): Channel<A, Pull.ExcludeDone<E>, void, unknown, unknown, unknown, R>;
export declare const fromEffectDone: <A, E, R>(effect: Effect.Effect<A, E, R>): Channel<never, Pull.ExcludeDone<E>, A, unknown, unknown, unknown, R>;
export declare const fromEffectDrain: <A, E, R>(effect: Effect.Effect<A, E, R>): Channel<never, E, void, unknown, unknown, unknown, R>;
export declare const fromEffectTake: <A, E, Done, E2, R>(effect: Effect.Effect<Take.Take<A, E, Done>, E2, R>): Channel<Arr.NonEmptyReadonlyArray<A>, E | E2, Done, unknown, unknown, unknown, R>;
export declare const fromIterable: <A, L>(iterable: Iterable<A, L>): Channel<A, never, L>;
export declare const fromIterableArray: <A, L>(iterable: Iterable<A, L>, chunkSize?: number): Channel<Arr.NonEmptyReadonlyArray<A>, never, L>;
export declare const fromIterator: <A, L>(iterator: LazyArg<Iterator<A, L>>): Channel<A, never, L>;
export declare const fromIteratorArray: <A, L>(iterator: LazyArg<Iterator<A, L>>, chunkSize?: number): Channel<Arr.NonEmptyReadonlyArray<A>, never, L>;
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Channel<A>;
export declare const fromPubSubArray: <A>(pubsub: PubSub.PubSub<A>): Channel<Arr.NonEmptyReadonlyArray<A>>;
export declare const fromPubSubTake: <A, E, Done>(pubsub: PubSub.PubSub<Take.Take<A, E, Done>>): Channel<Arr.NonEmptyReadonlyArray<A>, E, Done>;
export declare const fromPull: <OutElem, OutErr, OutDone, EX, EnvX, Env>(effect: Effect.Effect<Pull.Pull<OutElem, OutErr, OutDone, EnvX>, EX, Env>): Channel<OutElem, Pull.ExcludeDone<OutErr> | EX, OutDone, unknown, unknown, unknown, Env | EnvX>;
export declare const fromQueue: <A, E>(queue: Queue.Dequeue<A, E>): Channel<A, Exclude<E, Cause.Done>>;
export declare const fromQueueArray: <A, E>(queue: Queue.Dequeue<A, E>): Channel<Arr.NonEmptyReadonlyArray<A>, Exclude<E, Cause.Done>>;
export declare const fromSchedule: <O, E, R>(schedule: Schedule.Schedule<O, unknown, E, R>): Channel<O, E, O, unknown, unknown, unknown, R>;
export declare const fromSubscription: <A>(subscription: PubSub.Subscription<A>): Channel<A>;
export declare const fromSubscriptionArray: <A>(subscription: PubSub.Subscription<A>): Channel<Arr.NonEmptyReadonlyArray<A>>;
export declare const fromTransform: <OutElem, OutErr, OutDone, InElem, InErr, InDone, EX, EnvX, Env>(transform: (upstream: Pull.Pull<InElem, InErr, InDone>, scope: Scope.Scope) => Effect.Effect<Pull.Pull<OutElem, OutErr, OutDone, EnvX>, EX, Env>): Channel<OutElem, Pull.ExcludeDone<OutErr> | EX, OutDone, InElem, InErr, InDone, Env | EnvX>;
export declare const fromTransformBracket: <OutElem, OutErr, OutDone, InElem, InErr, InDone, EX, EnvX, Env>(f: (upstream: Pull.Pull<InElem, InErr, InDone>, scope: Scope.Scope, forkedScope: Scope.Scope) => Effect.Effect<Pull.Pull<OutElem, OutErr, OutDone, EnvX>, EX, Env>): Channel<OutElem, Pull.ExcludeDone<OutErr> | EX, OutDone, InElem, InErr, InDone, Env | EnvX>;
export declare const provideService: <I, S>(key: ServiceMap.Service<I, S>, service: NoInfer<S>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, I>>; // overload 1
export declare const provideService: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, I, S>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, key: ServiceMap.Service<I, S>, service: NoInfer<S>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, I>>; // overload 2
export declare const provideServiceEffect: <I, S, ES, RS>(key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr | ES, OutDone, InElem, InErr, InDone, Exclude<Env, I> | RS>; // overload 1
export declare const provideServiceEffect: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, I, S, ES, RS>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): Channel<OutElem, OutErr | ES, OutDone, InElem, InErr, InDone, Exclude<Env, I> | RS>; // overload 2
export declare const provideServices: <R2>(services: ServiceMap.ServiceMap<R2>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, R2>>; // overload 1
export declare const provideServices: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, R2>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, services: ServiceMap.ServiceMap<R2>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, R2>>; // overload 2
export declare const runCollect: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<Array<OutElem>, OutErr, Env>;
export declare const runCount: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<void, OutErr, Env>;
export declare const runDone: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<OutDone, OutErr, Env>;
export declare const runDrain: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<OutDone, OutErr, Env>;
export declare const runFold: <Z, OutElem>(initial: LazyArg<Z>, f: (acc: Z, o: OutElem) => Z): <OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<Z, OutErr, Env>; // overload 1
export declare const runFold: <OutElem, OutErr, OutDone, Env, Z>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, initial: LazyArg<Z>, f: (acc: Z, o: OutElem) => Z): Effect.Effect<Z, OutErr, Env>; // overload 2
export declare const runFoldEffect: <OutElem, Z, E, R>(initial: LazyArg<Z>, f: (acc: Z, o: OutElem) => Effect.Effect<Z, E, R>): <OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<Z, OutErr | E, Env | R>; // overload 1
export declare const runFoldEffect: <OutElem, OutErr, OutDone, Env, Z, E, R>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, initial: LazyArg<Z>, f: (acc: Z, o: OutElem) => Effect.Effect<Z, E, R>): Effect.Effect<Z, OutErr | E, Env | R>; // overload 2
export declare const runForEach: <OutElem, EX, RX>(f: (o: OutElem) => Effect.Effect<void, EX, RX>): <OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<OutDone, OutErr | EX, Env | RX>; // overload 1
export declare const runForEach: <OutElem, OutErr, OutDone, Env, EX, RX>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, f: (o: OutElem) => Effect.Effect<void, EX, RX>): Effect.Effect<OutDone, OutErr | EX, Env | RX>; // overload 2
export declare const runForEachWhile: <OutElem, EX, RX>(f: (o: OutElem) => Effect.Effect<boolean, EX, RX>): <OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<void, OutErr | EX, Env | RX>; // overload 1
export declare const runForEachWhile: <OutElem, OutErr, OutDone, Env, EX, RX>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, f: (o: OutElem) => Effect.Effect<boolean, EX, RX>): Effect.Effect<void, OutErr | EX, Env | RX>; // overload 2
export declare const runHead: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<Option.Option<OutElem>, OutErr, Env>;
export declare const runIntoPubSub: <OutElem>(pubsub: PubSub.PubSub<OutElem>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): <OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<void, never, Env>; // overload 1
export declare const runIntoPubSub: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, pubsub: PubSub.PubSub<OutElem>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): Effect.Effect<void, never, Env>; // overload 2
export declare const runIntoPubSubArray: <OutElem>(pubsub: PubSub.PubSub<OutElem>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): <OutErr, OutDone, Env>(self: Channel<Arr.NonEmptyReadonlyArray<OutElem>, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<OutDone, OutErr, Env>; // overload 1
export declare const runIntoPubSubArray: <OutElem, OutErr, OutDone, Env>(self: Channel<Arr.NonEmptyReadonlyArray<OutElem>, OutErr, OutDone, unknown, unknown, unknown, Env>, pubsub: PubSub.PubSub<OutElem>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): Effect.Effect<OutDone, OutErr, Env>; // overload 2
export declare const runIntoQueue: <OutElem, OutErr>(queue: Queue.Queue<OutElem, OutErr | Cause.Done>): <OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<void, never, Env>; // overload 1
export declare const runIntoQueue: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>, queue: Queue.Queue<OutElem, OutErr | Cause.Done>): Effect.Effect<void, never, Env>; // overload 2
export declare const runIntoQueueArray: <OutElem, OutErr>(queue: Queue.Queue<OutElem, OutErr | Cause.Done>): <OutDone, Env>(self: Channel<Arr.NonEmptyReadonlyArray<OutElem>, OutErr, OutDone, unknown, unknown, unknown, Env>) => Effect.Effect<void, never, Env>; // overload 1
export declare const runIntoQueueArray: <OutElem, OutErr, OutDone, Env>(self: Channel<Arr.NonEmptyReadonlyArray<OutElem>, OutErr, OutDone, unknown, unknown, unknown, Env>, queue: Queue.Queue<OutElem, OutErr | Cause.Done>): Effect.Effect<void, never, Env>; // overload 2
export declare const runLast: <OutElem, OutErr, OutDone, Env>(self: Channel<OutElem, OutErr, OutDone, unknown, unknown, unknown, Env>): Effect.Effect<Option.Option<OutElem>, OutErr, Env>;
export declare const servicesWith: <Env, OutElem, OutErr, OutDone, InElem, InErr, InDone, Env2>(f: (services: ServiceMap.ServiceMap<Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env2>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env | Env2>;
export declare const updateService: <I, S>(key: ServiceMap.Service<I, S>, f: (service: NoInfer<S>) => S): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env>) => Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env | I>; // overload 1
export declare const updateService: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, I, S>(self: Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env>, service: ServiceMap.Service<I, S>, f: (service: NoInfer<S>) => S): Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env | I>; // overload 2
export declare const updateServices: <Env, R2>(f: (services: ServiceMap.ServiceMap<R2>) => ServiceMap.ServiceMap<Env>): <OutElem, OutErr, OutDone, InElem, InErr, InDone>(self: Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env>) => Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, R2>; // overload 1
export declare const updateServices: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, R2>(self: Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env>, f: (services: ServiceMap.ServiceMap<R2>) => ServiceMap.ServiceMap<Env>): Channel<OutElem, InElem, OutErr, InErr, OutDone, InDone, R2>; // overload 2
```

## Other Exports (Non-Function)

- `Channel` (interface)
- `ChannelUnify` (interface)
- `ChannelUnifyIgnore` (interface)
- `DefaultChunkSize` (variable)
- `Do` (variable)
- `empty` (variable)
- `HaltStrategy` (type)
- `never` (variable)
- `Variance` (interface)
- `VarianceStruct` (interface)
