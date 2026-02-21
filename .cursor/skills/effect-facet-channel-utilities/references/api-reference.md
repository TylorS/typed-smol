# API Reference: effect/Channel#utilities

- Import path: `effect/Channel#utilities`
- Source file: `packages/effect/src/Channel.ts`
- Thematic facet: `utilities`
- Function exports (callable): 9
- Non-function exports: 10

## Purpose

The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## Key Function Exports

- `identity`
- `mapError`
- `mapInputError`
- `onError`
- `provide`
- `provideService`
- `provideServiceEffect`
- `provideServices`
- `tapError`

## All Function Signatures

```ts
export declare const identity: <Elem, Err, Done>(): Channel<Elem, Err, Done, Elem, Err, Done>;
export declare const mapError: <OutErr, OutErr2>(f: (err: OutErr) => OutErr2): <OutElem, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr2, OutDone, InElem, InErr, InDone, Env>; // overload 1
export declare const mapError: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, OutErr2>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, f: (err: OutErr) => OutErr2): Channel<OutElem, OutErr2, OutDone, InElem, InErr, InDone, Env>; // overload 2
export declare const mapInputError: <InErr, InErr2, R = never>(f: (i: InErr2) => Effect.Effect<InErr, InErr, R>): <OutElem, OutErr, OutDone, InElem, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env | R>) => Channel<OutElem, OutErr, OutDone, InElem, InErr2, InDone, Env>; // overload 1
export declare const mapInputError: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, InErr2, R = never>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, f: (i: InErr2) => Effect.Effect<InErr, InErr, R>): Channel<OutElem, OutErr, OutDone, InElem, InErr2, InDone, Env | R>; // overload 2
export declare const onError: <OutDone, OutErr, Env2>(finalizer: (cause: Cause.Cause<OutErr>) => Effect.Effect<unknown, never, Env2>): <OutElem, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env2 | Env>; // overload 1
export declare const onError: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, Env2>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, finalizer: (cause: Cause.Cause<OutErr>) => Effect.Effect<unknown, never, Env2>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env2 | Env>; // overload 2
export declare const provide: <A, E = never, R = never>(layer: Layer.Layer<A, E, R> | ServiceMap.ServiceMap<A>, options?: { readonly local?: boolean | undefined; } | undefined): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr | E, OutDone, InElem, InErr, InDone, Exclude<Env, A> | R>; // overload 1
export declare const provide: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, A, E = never, R = never>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, layer: Layer.Layer<A, E, R> | ServiceMap.ServiceMap<A>, options?: { readonly local?: boolean | undefined; } | undefined): Channel<OutElem, OutErr | E, OutDone, InElem, InErr, InDone, Exclude<Env, A> | R>; // overload 2
export declare const provideService: <I, S>(key: ServiceMap.Service<I, S>, service: NoInfer<S>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, I>>; // overload 1
export declare const provideService: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, I, S>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, key: ServiceMap.Service<I, S>, service: NoInfer<S>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, I>>; // overload 2
export declare const provideServiceEffect: <I, S, ES, RS>(key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr | ES, OutDone, InElem, InErr, InDone, Exclude<Env, I> | RS>; // overload 1
export declare const provideServiceEffect: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, I, S, ES, RS>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): Channel<OutElem, OutErr | ES, OutDone, InElem, InErr, InDone, Exclude<Env, I> | RS>; // overload 2
export declare const provideServices: <R2>(services: ServiceMap.ServiceMap<R2>): <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, R2>>; // overload 1
export declare const provideServices: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, R2>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, services: ServiceMap.ServiceMap<R2>): Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Exclude<Env, R2>>; // overload 2
export declare const tapError: <OutErr, A, E, R>(f: (d: OutErr) => Effect.Effect<A, E, R>): <OutElem, OutDone, InElem, InErr, InDone, Env>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>) => Channel<OutElem, OutErr | E, OutDone | void, InElem, InErr, InDone, Env | R>; // overload 1
export declare const tapError: <OutElem, OutErr, OutDone, InElem, InErr, InDone, Env, A, E, R>(self: Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>, f: (d: OutErr) => Effect.Effect<A, E, R>): Channel<OutElem, OutErr | E, OutDone | void, InElem, InErr, InDone, Env | R>; // overload 2
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
