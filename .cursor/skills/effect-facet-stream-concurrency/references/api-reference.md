# API Reference: effect/Stream#concurrency

- Import path: `effect/Stream#concurrency`
- Source file: `packages/effect/src/Stream.ts`
- Thematic facet: `concurrency`
- Function exports (callable): 13
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `drainFork`
- `fromPubSub`
- `fromPubSubTake`
- `fromQueue`
- `interruptWhen`
- `partitionQueue`
- `race`
- `raceAll`
- `runIntoPubSub`
- `runIntoQueue`
- `toPubSub`
- `toPubSubTake`
- `toQueue`

## All Function Signatures

```ts
export declare const drainFork: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const drainFork: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Stream<A>;
export declare const fromPubSubTake: <A, E>(pubsub: PubSub.PubSub<Take.Take<A, E>>): Stream<A, E>;
export declare const fromQueue: <A, E>(queue: Queue.Dequeue<A, E>): Stream<A, Exclude<E, Cause.Done>>;
export declare const interruptWhen: <X, E2, R2>(effect: Effect.Effect<X, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const interruptWhen: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, effect: Effect.Effect<X, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const partitionQueue: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>, options?: { readonly capacity?: number | "unbounded" | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[passes: Queue.Dequeue<B, E | Cause.Done>, fails: Queue.Dequeue<Exclude<A, B>, E | Cause.Done>], never, R | Scope.Scope>; // overload 1
export declare const partitionQueue: <A, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly capacity?: number | "unbounded" | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[passes: Queue.Dequeue<Filter.Pass<A, Result>, E | Cause.Done>, fails: Queue.Dequeue<Filter.Fail<A, Result>, E | Cause.Done>], never, R | Scope.Scope>; // overload 2
export declare const partitionQueue: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: Refinement<A, B>, options?: { readonly capacity?: number | "unbounded" | undefined; }): Effect.Effect<[passes: Queue.Dequeue<B, E | Cause.Done>, fails: Queue.Dequeue<Exclude<A, B>, E | Cause.Done>], never, R | Scope.Scope>; // overload 3
export declare const partitionQueue: <A, E, R, Result extends Filter.ResultOrBool>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly capacity?: number | "unbounded" | undefined; }): Effect.Effect<[passes: Queue.Dequeue<Filter.Pass<A, Result>, E | Cause.Done>, fails: Queue.Dequeue<Filter.Fail<A, Result>, E | Cause.Done>], never, R | Scope.Scope>; // overload 4
export declare const race: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL | AR, EL | ER, RL | RR>; // overload 1
export declare const race: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL | AR, EL | ER, RL | RR>; // overload 2
export declare const raceAll: <S extends ReadonlyArray<Stream<any, any, any>>>(...streams: S): Stream<Success<S[number]>, Error<S[number]>, Services<S[number]>>;
export declare const runIntoPubSub: <A>(pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E, R>; // overload 1
export declare const runIntoPubSub: <A, E, R>(self: Stream<A, E, R>, pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): Effect.Effect<void, never, R>; // overload 2
export declare const runIntoQueue: <A, E>(queue: Queue.Queue<A, E | Cause.Done>): <R>(self: Stream<A, E, R>) => Effect.Effect<void, never, R>; // overload 1
export declare const runIntoQueue: <A, E, R>(self: Stream<A, E, R>, queue: Queue.Queue<A, E | Cause.Done>): Effect.Effect<void, never, R>; // overload 2
export declare const toPubSub: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 1
export declare const toPubSub: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
export declare const toPubSubTake: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 1
export declare const toPubSubTake: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 2
export declare const toQueue: (options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E | Cause.Done>, never, R | Scope.Scope>; // overload 1
export declare const toQueue: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
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
