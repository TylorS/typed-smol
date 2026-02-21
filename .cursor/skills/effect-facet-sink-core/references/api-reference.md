# API Reference: effect/Sink#core

- Import path: `effect/Sink#core`
- Source file: `packages/effect/src/Sink.ts`
- Thematic facet: `core`
- Function exports (callable): 9
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromChannel`
- `fromEffect`
- `fromEffectEnd`
- `fromPubSub`
- `fromQueue`
- `fromTransform`
- `make`
- `provideService`
- `provideServices`

## All Function Signatures

```ts
export declare const fromChannel: <L, In, E, A, R>(channel: Channel.Channel<never, E, End<A, L>, NonEmptyReadonlyArray<In>, never, void, R>): Sink<A, In, L, E, R>;
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>): Sink<A, unknown, never, E, R>;
export declare const fromEffectEnd: <A, E, R, L = never>(effect: Effect.Effect<End<A, L>, E, R>): Sink<A, unknown, L, E, R>;
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Sink<void, A>;
export declare const fromQueue: <A>(queue: Queue.Queue<A, Cause.Done>): Sink<void, A>;
export declare const fromTransform: <In, A, E, R, L = never>(transform: (upstream: Pull.Pull<NonEmptyReadonlyArray<In>, never, void>, scope: Scope.Scope) => Effect.Effect<End<A, L>, E, R>): Sink<A, In, L, E, R>;
export declare const make: <In>(): make.Constructor<In>;
export declare const provideService: <I, S>(key: ServiceMap.Service<I, S>, value: Types.NoInfer<S>): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E, Exclude<R, I>>; // overload 1
export declare const provideService: <A, In, L, E, R, I, S>(self: Sink<A, In, L, E, R>, key: ServiceMap.Service<I, S>, value: Types.NoInfer<S>): Sink<A, In, L, E, Exclude<R, I>>; // overload 2
export declare const provideServices: <Provided>(services: ServiceMap.ServiceMap<Provided>): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E, Exclude<R, Provided>>; // overload 1
export declare const provideServices: <A, In, L, E, R, Provided>(self: Sink<A, In, L, E, R>, services: ServiceMap.ServiceMap<Provided>): Sink<A, In, L, E, Exclude<R, Provided>>; // overload 2
```

## Other Exports (Non-Function)

- `count` (variable)
- `drain` (variable)
- `End` (type)
- `never` (variable)
- `Sink` (interface)
- `SinkUnify` (interface)
- `SinkUnifyIgnore` (interface)
- `sum` (variable)
- `timed` (variable)
