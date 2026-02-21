# API Reference: effect/Sink#reducing

- Import path: `effect/Sink#reducing`
- Source file: `packages/effect/src/Sink.ts`
- Thematic facet: `reducing`
- Function exports (callable): 66
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `as`
- `catch`
- `catchCause`
- `collect`
- `die`
- `ensuring`
- `every`
- `fail`
- `failCause`
- `failCauseSync`
- `failSync`
- `find`
- `findEffect`
- `flatMap`
- `fold`
- `foldArray`
- `foldUntil`
- `forEach`

## All Function Signatures

```ts
export declare const as: <A2>(a2: A2): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L, E, R>; // overload 1
export declare const as: <A, In, L, E, R, A2>(self: Sink<A, In, L, E, R>, a2: A2): Sink<A2, In, L, E, R>; // overload 2
export declare const catch: <E, A2, E2, R2>(f: (error: Types.NoInfer<E>) => Effect.Effect<A2, E2, R2>): <A, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A2 | A, In, L, E, R2 | R>; // overload 1
export declare const catch: <A, In, L, E, R, A2, E2, R2>(self: Sink<A, In, L, E, R>, f: (error: E) => Effect.Effect<A2, E2, R2>): Sink<A | A2, In, L, E2, R | R2>; // overload 2
export declare const catchCause: <E, A2, E2, R2>(f: (error: Cause.Cause<Types.NoInfer<E>>) => Effect.Effect<A2, E2, R2>): <A, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A2 | A, In, L, E, R2 | R>; // overload 1
export declare const catchCause: <A, In, L, E, R, A2, E2, R2>(self: Sink<A, In, L, E, R>, f: (error: Cause.Cause<E>) => Effect.Effect<A2, E2, R2>): Sink<A | A2, In, L, E2, R | R2>; // overload 2
export declare const collect: <In>(): Sink<Array<In>, In>;
export declare const die: (defect: unknown): Sink<never>;
export declare const ensuring: <X, E2, R2>(effect: Effect.Effect<X, E2, R2>): <A, E, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E | E2, R2 | R>; // overload 1
export declare const ensuring: <A, In, L, E, R, X, E2, R2>(self: Sink<A, In, L, E, R>, effect: Effect.Effect<X, E2, R2>): Sink<A, In, L, E | E2, R | R2>; // overload 2
export declare const every: <In>(predicate: Predicate<In>): Sink<boolean, In, In>;
export declare const fail: <E>(e: E): Sink<never, unknown, never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Sink<never, unknown, never, E>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Sink<never, unknown, never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Sink<never, unknown, never, E>;
export declare const find: <In, Out extends In>(refinement: Refinement<In, Out>): Sink<Option.Option<Out>, In, In>; // overload 1
export declare const find: <In>(predicate: Predicate<In>): Sink<Option.Option<In>, In, In>; // overload 2
export declare const findEffect: <In, E, R>(predicate: (input: In) => Effect.Effect<boolean, E, R>): Sink<Option.Option<In>, In, In, E, R>;
export declare const flatMap: <A, A1, L, In1 extends L, L1, E1, R1>(f: (a: A) => Sink<A1, In1, L1, E1, R1>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A1, In & In1, L1 | L, E1 | E, R1 | R>; // overload 1
export declare const flatMap: <A, In, L, E, R, A1, In1 extends L, L1, E1, R1>(self: Sink<A, In, L, E, R>, f: (a: A) => Sink<A1, In1, L1, E1, R1>): Sink<A1, In & In1, L | L1, E | E1, R | R1>; // overload 2
export declare const fold: <S, In, E = never, R = never>(s: LazyArg<S>, contFn: Predicate<S>, f: (s: S, input: In) => Effect.Effect<S, E, R>): Sink<S, In, In, E, R>;
export declare const foldArray: <S, In, E = never, R = never>(s: LazyArg<S>, contFn: Predicate<S>, f: (s: S, input: Arr.NonEmptyReadonlyArray<In>) => Effect.Effect<S, E, R>): Sink<S, In, never, E, R>;
export declare const foldUntil: <S, In, E = never, R = never>(s: LazyArg<S>, max: number, f: (s: S, input: In) => Effect.Effect<S, E, R>): Sink<S, In, In, E, R>;
export declare const forEach: <In, X, E, R>(f: (input: In) => Effect.Effect<X, E, R>): Sink<void, In, never, E, R>;
export declare const forEachArray: <In, X, E, R>(f: (input: NonEmptyReadonlyArray<In>) => Effect.Effect<X, E, R>): Sink<void, In, never, E, R>;
export declare const forEachWhile: <In, E, R>(f: (input: In) => Effect.Effect<boolean, E, R>): Sink<void, In, never, E, R>;
export declare const forEachWhileArray: <In, E, R>(f: (input: NonEmptyReadonlyArray<In>) => Effect.Effect<boolean, E, R>): Sink<void, In, never, E, R>;
export declare const fromChannel: <L, In, E, A, R>(channel: Channel.Channel<never, E, End<A, L>, NonEmptyReadonlyArray<In>, never, void, R>): Sink<A, In, L, E, R>;
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>): Sink<A, unknown, never, E, R>;
export declare const fromEffectEnd: <A, E, R, L = never>(effect: Effect.Effect<End<A, L>, E, R>): Sink<A, unknown, L, E, R>;
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Sink<void, A>;
export declare const fromQueue: <A>(queue: Queue.Queue<A, Cause.Done>): Sink<void, A>;
export declare const fromTransform: <In, A, E, R, L = never>(transform: (upstream: Pull.Pull<NonEmptyReadonlyArray<In>, never, void>, scope: Scope.Scope) => Effect.Effect<End<A, L>, E, R>): Sink<A, In, L, E, R>;
export declare const head: <In>(): Sink<Option.Option<In>, In, In>;
export declare const ignoreLeftover: <A, In, L, E, R>(self: Sink<A, In, L, E, R>): Sink<A, In, never, E, R>;
export declare const isSink: (u: unknown): u is Sink<unknown, never, unknown, unknown, unknown>;
export declare const last: <In>(): Sink<Option.Option<In>, In>;
export declare const make: <In>(): make.Constructor<In>;
export declare const map: <A, A2>(f: (a: A) => A2): <In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L, E, R>; // overload 1
export declare const map: <A, In, L, E, R, A2>(self: Sink<A, In, L, E, R>, f: (a: A) => A2): Sink<A2, In, L, E, R>; // overload 2
export declare const mapEffect: <A, A2, E2, R2>(f: (a: A) => Effect.Effect<A2, E2, R2>): <In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L, E2 | E, R2 | R>; // overload 1
export declare const mapEffect: <A, In, L, E, R, A2, E2, R2>(self: Sink<A, In, L, E, R>, f: (a: A) => Effect.Effect<A2, E2, R2>): Sink<A2, In, L, E | E2, R | R2>; // overload 2
export declare const mapEffectEnd: <A, L, A2, E2, R2, L2 = never>(f: (end: End<A, L>) => Effect.Effect<End<A2, L2>, E2, R2>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L2, E2 | E, R2 | R>; // overload 1
export declare const mapEffectEnd: <A, In, L, E, R, A2, E2, R2, L2 = never>(self: Sink<A, In, L, E, R>, f: (end: End<A, L>) => Effect.Effect<End<A2, L2>, E2, R2>): Sink<A2, In, L2, E | E2, R | R2>; // overload 2
export declare const mapEnd: <A, L, A2, L2 = never>(f: (a: End<A, L>) => End<A2, L2>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L2, E, R>; // overload 1
export declare const mapEnd: <A, In, L, E, R, A2, L2 = never>(self: Sink<A, In, L, E, R>, f: (a: End<A, L>) => End<A2, L2>): Sink<A2, In, L2, E, R>; // overload 2
export declare const mapError: <E, E2>(f: (error: E) => E2): <A, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E2, R>; // overload 1
export declare const mapError: <A, In, L, E, R, E2>(self: Sink<A, In, L, E, R>, f: (error: E) => E2): Sink<A, In, L, E2, R>; // overload 2
export declare const mapInput: <In0, In>(f: (input: In0) => In): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E, R>; // overload 1
export declare const mapInput: <A, In, L, E, R, In0>(self: Sink<A, In, L, E, R>, f: (input: In0) => In): Sink<A, In0, L, E, R>; // overload 2
export declare const mapInputArray: <In0, In>(f: (input: Arr.NonEmptyReadonlyArray<In0>) => Arr.NonEmptyReadonlyArray<In>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E, R>; // overload 1
export declare const mapInputArray: <A, In, L, E, R, In0>(self: Sink<A, In, L, E, R>, f: (input: Arr.NonEmptyReadonlyArray<In0>) => Arr.NonEmptyReadonlyArray<In>): Sink<A, In0, L, E, R>; // overload 2
export declare const mapInputArrayEffect: <In0, In, E2, R2>(f: (input: Arr.NonEmptyReadonlyArray<In0>) => Effect.Effect<Arr.NonEmptyReadonlyArray<In>, E2, R2>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E2 | E, R2 | R>; // overload 1
export declare const mapInputArrayEffect: <A, In, L, E, R, In0, E2, R2>(self: Sink<A, In, L, E, R>, f: (input: Arr.NonEmptyReadonlyArray<In0>) => Effect.Effect<Arr.NonEmptyReadonlyArray<In>, E2, R2>): Sink<A, In0, L, E | E2, R | R2>; // overload 2
export declare const mapInputEffect: <In0, In, E2, R2>(f: (input: In0) => Effect.Effect<In, E2, R2>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E2 | E, R2 | R>; // overload 1
export declare const mapInputEffect: <A, In, L, E, R, In0, E2, R2>(self: Sink<A, In, L, E, R>, f: (input: In0) => Effect.Effect<In, E2, R2>): Sink<A, In0, L, E | E2, R | R2>; // overload 2
export declare const mapLeftover: <L, L2>(f: (leftover: L) => L2): <A, In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L2, E, R>; // overload 1
export declare const mapLeftover: <A, In, L, E, R, L2>(self: Sink<A, In, L, E, R>, f: (leftover: L) => L2): Sink<A, In, L2, E, R>; // overload 2
export declare const onExit: <A, E, X, E2, R2>(f: (exit: Exit.Exit<A, E>) => Effect.Effect<X, E2, R2>): <In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E | E2, R2 | R>; // overload 1
export declare const onExit: <A, In, L, E, R, X, E2, R2>(self: Sink<A, In, L, E, R>, f: (exit: Exit.Exit<A, E>) => Effect.Effect<X, E2, R2>): Sink<A, In, L, E | E2, R | R2>; // overload 2
export declare const orElse: <E, A2, In2, L2, E2, R2>(f: (error: Types.NoInfer<E>) => Sink<A2, In2, L2, E2, R2>): <A, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A2 | A, In & In2, L2 | L, E2 | E, R2 | R>; // overload 1
export declare const orElse: <A, In, L, E, R, A2, In2, L2, E2, R2>(self: Sink<A, In, L, E, R>, f: (error: E) => Sink<A2, In2, L2, E2, R2>): Sink<A | A2, In & In2, L | L2, E | E2, R | R2>; // overload 2
export declare const provideService: <I, S>(key: ServiceMap.Service<I, S>, value: Types.NoInfer<S>): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E, Exclude<R, I>>; // overload 1
export declare const provideService: <A, In, L, E, R, I, S>(self: Sink<A, In, L, E, R>, key: ServiceMap.Service<I, S>, value: Types.NoInfer<S>): Sink<A, In, L, E, Exclude<R, I>>; // overload 2
export declare const provideServices: <Provided>(services: ServiceMap.ServiceMap<Provided>): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E, Exclude<R, Provided>>; // overload 1
export declare const provideServices: <A, In, L, E, R, Provided>(self: Sink<A, In, L, E, R>, services: ServiceMap.ServiceMap<Provided>): Sink<A, In, L, E, Exclude<R, Provided>>; // overload 2
export declare const reduce: <S, In>(initial: LazyArg<S>, f: (s: S, input: In) => S): Sink<S, In>;
export declare const reduceArray: <S, In>(initial: LazyArg<S>, f: (s: S, input: NonEmptyReadonlyArray<In>) => S): Sink<S, In>;
export declare const reduceEffect: <S, In, E, R>(initial: LazyArg<S>, f: (s: S, input: In) => Effect.Effect<S, E, R>): Sink<S, In, never, E, R>;
export declare const reduceWhile: <S, In>(initial: LazyArg<S>, predicate: Predicate<S>, f: (s: S, input: In) => S): Sink<S, In, In>;
export declare const reduceWhileArray: <S, In>(initial: LazyArg<S>, contFn: Predicate<S>, f: (s: S, input: NonEmptyReadonlyArray<In>) => S): Sink<S, In>;
export declare const reduceWhileArrayEffect: <S, In, E, R>(initial: LazyArg<S>, predicate: Predicate<S>, f: (s: S, input: NonEmptyReadonlyArray<In>) => Effect.Effect<S, E, R>): Sink<S, In, never, E, R>;
export declare const reduceWhileEffect: <S, In, E, R>(initial: LazyArg<S>, predicate: Predicate<S>, f: (s: S, input: In) => Effect.Effect<S, E, R>): Sink<S, In, In, E, R>;
export declare const some: <In>(predicate: Predicate<In>): Sink<boolean, In, In>;
export declare const succeed: <A, L = never>(a: A, leftovers?: NonEmptyReadonlyArray<L> | undefined): Sink<A, unknown, L>;
export declare const summarized: <A2, E2, R2, A3>(summary: Effect.Effect<A2, E2, R2>, f: (start: A2, end: A2) => A3): <A, In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<[A, A3], In, L, E2 | E, R2 | R>; // overload 1
export declare const summarized: <A, In, L, E, R, A2, E2, R2, A3>(self: Sink<A, In, L, E, R>, summary: Effect.Effect<A2, E2, R2>, f: (start: A2, end: A2) => A3): Sink<[A, A3], In, L, E | E2, R | R2>; // overload 2
export declare const suspend: <A, In, L, E, R>(evaluate: LazyArg<Sink<A, In, L, E, R>>): Sink<A, In, L, E, R>;
export declare const sync: <A>(a: LazyArg<A>): Sink<A>;
export declare const take: <In>(n: number): Sink<Array<In>, In, In>;
export declare const takeUntil: <In>(predicate: Predicate<In>): Sink<Array<In>, In, In>;
export declare const takeUntilEffect: <In, E, R>(predicate: (input: In) => Effect.Effect<boolean, E, R>): Sink<Array<In>, In, In, E, R>;
export declare const takeWhile: <In, Out extends In>(refinement: Refinement<In, Out>): Sink<Array<Out>, In, In>; // overload 1
export declare const takeWhile: <In>(predicate: Predicate<In>): Sink<Array<In>, In, In>; // overload 2
export declare const takeWhile: <In, Out, X>(filter: Filter.Filter<In, Out, X>): Sink<Array<Out>, In, In>; // overload 3
export declare const takeWhileEffect: <In, E, R>(predicate: (input: In) => Effect.Effect<boolean, E, R>): Sink<Array<In>, In, In, E, R>; // overload 1
export declare const takeWhileEffect: <In, Out, X, E, R>(filter: Filter.FilterEffect<In, Out, X, E, R>): Sink<Array<Out>, In, In, E, R>; // overload 2
export declare const toChannel: <A, In, L, E, R>(self: Sink<A, In, L, E, R>): Channel.Channel<never, E, End<A, L>, NonEmptyReadonlyArray<In>, never, void, R>;
export declare const unwrap: <A, In, L, E, R, R2>(effect: Effect.Effect<Sink<A, In, L, E, R2>, E, R>): Sink<A, In, L, E, Exclude<R, Scope.Scope> | R2>;
export declare const withDuration: <A, In, L, E, R>(self: Sink<A, In, L, E, R>): Sink<[A, Duration.Duration], In, L, E, R>;
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
