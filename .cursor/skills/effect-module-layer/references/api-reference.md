# API Reference: effect/Layer

- Import path: `effect/Layer`
- Source file: `packages/effect/src/Layer.ts`
- Function exports (callable): 35
- Non-function exports: 12

## Purpose

A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## Key Function Exports

- `build`
- `buildWithMemoMap`
- `buildWithScope`
- `catch`
- `catchCause`
- `catchTag`
- `effect`
- `effectDiscard`
- `effectServices`
- `flatMap`
- `fresh`
- `fromBuild`
- `fromBuildMemo`
- `isLayer`
- `launch`
- `makeMemoMapUnsafe`
- `merge`
- `mergeAll`

## All Function Signatures

```ts
export declare const build: <RIn, E, ROut>(self: Layer<ROut, E, RIn>): Effect<ServiceMap.ServiceMap<ROut>, E, RIn | Scope.Scope>;
export declare const buildWithMemoMap: (memoMap: MemoMap, scope: Scope.Scope): <RIn, E, ROut>(self: Layer<ROut, E, RIn>) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 1
export declare const buildWithMemoMap: <RIn, E, ROut>(self: Layer<ROut, E, RIn>, memoMap: MemoMap, scope: Scope.Scope): Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 2
export declare const buildWithScope: (scope: Scope.Scope): <RIn, E, ROut>(self: Layer<ROut, E, RIn>) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 1
export declare const buildWithScope: <RIn, E, ROut>(self: Layer<ROut, E, RIn>, scope: Scope.Scope): Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 2
export declare const catch: <E, RIn2, E2, ROut2>(onError: (error: E) => Layer<ROut2, E2, RIn2>): <RIn, ROut>(self: Layer<ROut, E, RIn>) => Layer<ROut & ROut2, E2, RIn2 | RIn>; // overload 1
export declare const catch: <RIn, E, ROut, RIn2, E2, ROut2>(self: Layer<ROut, E, RIn>, onError: (error: E) => Layer<ROut2, E2, RIn2>): Layer<ROut & ROut2, E2, RIn | RIn2>; // overload 2
export declare const catchCause: <E, RIn2, E2, ROut2>(onError: (cause: Cause.Cause<E>) => Layer<ROut2, E2, RIn2>): <RIn, ROut>(self: Layer<ROut, E, RIn>) => Layer<ROut & ROut2, E2, RIn2 | RIn>; // overload 1
export declare const catchCause: <RIn, E, ROut, RIn2, E2, ROut22>(self: Layer<ROut, E, RIn>, onError: (cause: Cause.Cause<E>) => Layer<ROut22, E2, RIn2>): Layer<ROut & ROut22, E2, RIn | RIn2>; // overload 2
export declare const catchTag: <const K extends Types.Tags<E> | NonEmptyReadonlyArray<Types.Tags<E>>, E, RIn2, E2, ROut2>(k: K, f: (e: Types.ExtractTag<Types.NoInfer<E>, K extends NonEmptyReadonlyArray<string> ? K[number] : K>) => Layer<ROut2, E2, RIn2>): <RIn, ROut>(self: Layer<ROut, E, RIn>) => Layer<ROut & ROut2, E2 | Types.ExcludeTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>, RIn2 | RIn>; // overload 1
export declare const catchTag: <RIn, E, ROut, const K extends Types.Tags<E> | NonEmptyReadonlyArray<Types.Tags<E>>, RIn2, E2, ROut2>(self: Layer<ROut, E, RIn>, k: K, f: (e: Types.ExtractTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>) => Layer<ROut2, E2, RIn2>): Layer<ROut & ROut2, E2 | Types.ExcludeTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>, RIn | RIn2>; // overload 2
export declare const effect: <I, S>(service: ServiceMap.Service<I, S>): <E, R>(effect: Effect<S, E, R>) => Layer<I, E, Exclude<R, Scope.Scope>>; // overload 1
export declare const effect: <I, S, E, R>(service: ServiceMap.Service<I, S>, effect: Effect<S, E, R>): Layer<I, E, Exclude<R, Scope.Scope>>; // overload 2
export declare const effectDiscard: <X, E, R>(effect: Effect<X, E, R>): Layer<never, E, Exclude<R, Scope.Scope>>;
export declare const effectServices: <A, E, R>(effect: Effect<ServiceMap.ServiceMap<A>, E, R>): Layer<A, E, Exclude<R, Scope.Scope>>;
export declare const flatMap: <A, A2, E2, R2>(f: (context: ServiceMap.ServiceMap<A>) => Layer<A2, E2, R2>): <E, R>(self: Layer<A, E, R>) => Layer<A2, E2 | E, R2 | R>; // overload 1
export declare const flatMap: <A, E, R, A2, E2, R2>(self: Layer<A, E, R>, f: (context: ServiceMap.ServiceMap<A>) => Layer<A2, E2, R2>): Layer<A2, E | E2, R | R2>; // overload 2
export declare const fresh: <A, E, R>(self: Layer<A, E, R>): Layer<A, E, R>;
export declare const fromBuild: <ROut, E, RIn>(build: (memoMap: MemoMap, scope: Scope.Scope) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>): Layer<ROut, E, RIn>;
export declare const fromBuildMemo: <ROut, E, RIn>(build: (memoMap: MemoMap, scope: Scope.Scope) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>): Layer<ROut, E, RIn>;
export declare const isLayer: (u: unknown): u is Layer<unknown, unknown, unknown>;
export declare const launch: <RIn, E, ROut>(self: Layer<ROut, E, RIn>): Effect<never, E, RIn>;
export declare const makeMemoMapUnsafe: (): MemoMap;
export declare const merge: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut | ROut2, E | E2, RIn | RIn2>; // overload 1
export declare const merge: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | R>; // overload 2
export declare const merge: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut | ROut2, E | E2, RIn | RIn2>; // overload 3
export declare const merge: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | R>; // overload 4
export declare const mergeAll: <Layers extends [Layer<never, any, any>, ...Array<Layer<never, any, any>>]>(...layers: Layers): Layer<Success<Layers[number]>, Error<Layers[number]>, Services<Layers[number]>>;
export declare const mock: <I, S extends object>(service: ServiceMap.Service<I, S>): (implementation: PartialEffectful<S>) => Layer<I>;
export declare const orDie: <A, E, R>(self: Layer<A, E, R>): Layer<A, never, R>;
export declare const parentSpan: (span: Tracer.AnySpan): Layer<Tracer.ParentSpan>;
export declare const provide: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 1
export declare const provide: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 2
export declare const provide: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 3
export declare const provide: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 4
export declare const provideMerge: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut | ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 1
export declare const provideMerge: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 2
export declare const provideMerge: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut | ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 3
export declare const provideMerge: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 4
export declare const satisfiesErrorType: <E>(): <ROut, E2 extends E, RIn>(layer: Layer<ROut, E2, RIn>) => Layer<ROut, E2, RIn>;
export declare const satisfiesServicesType: <RIn>(): <ROut, E, RIn2 extends RIn>(layer: Layer<ROut, E, RIn2>) => Layer<ROut, E, RIn2>;
export declare const satisfiesSuccessType: <ROut>(): <ROut2 extends ROut, E, RIn>(layer: Layer<ROut2, E, RIn>) => Layer<ROut2, E, RIn>;
export declare const span: (name: string, options?: SpanOptions): Layer<Tracer.ParentSpan>;
export declare const succeed: <I, S>(service: ServiceMap.Service<I, S>): (resource: S) => Layer<I>; // overload 1
export declare const succeed: <I, S>(service: ServiceMap.Service<I, S>, resource: Types.NoInfer<S>): Layer<I>; // overload 2
export declare const succeedServices: <A>(services: ServiceMap.ServiceMap<A>): Layer<A>;
export declare const sync: <I, S>(service: ServiceMap.Service<I, S>): (evaluate: LazyArg<S>) => Layer<I>; // overload 1
export declare const sync: <I, S>(service: ServiceMap.Service<I, S>, evaluate: LazyArg<S>): Layer<I>; // overload 2
export declare const syncServices: <A>(evaluate: LazyArg<ServiceMap.ServiceMap<A>>): Layer<A>;
export declare const unwrap: <A, E1, R1, E, R>(self: Effect<Layer<A, E1, R1>, E, R>): Layer<A, E | E1, R1 | Exclude<R, Scope.Scope>>;
export declare const updateService: <I, A>(service: ServiceMap.Service<I, A>, f: (a: A) => A): <A1, E1, R1>(layer: Layer<A1, E1, R1>) => Layer<A1, E1, I | R1>; // overload 1
export declare const updateService: <A1, E1, R1, I, A>(layer: Layer<A1, E1, R1>, service: ServiceMap.Service<I, A>, f: (a: A) => A): Layer<A1, E1, I | R1>; // overload 2
export declare const withParentSpan: (span: Tracer.AnySpan, options?: Tracer.TraceOptions): <A, E, R>(self: Layer<A, E, R>) => Layer<A, E, Exclude<R, Tracer.ParentSpan>>; // overload 1
export declare const withParentSpan: <A, E, R>(self: Layer<A, E, R>, span: Tracer.AnySpan, options?: Tracer.TraceOptions): Layer<A, E, Exclude<R, Tracer.ParentSpan>>; // overload 2
export declare const withSpan: (name: string, options?: SpanOptions): <A, E, R>(self: Layer<A, E, R>) => Layer<A, E, Exclude<R, Tracer.ParentSpan>>; // overload 1
export declare const withSpan: <A, E, R>(self: Layer<A, E, R>, name: string, options?: SpanOptions): Layer<A, E, Exclude<R, Tracer.ParentSpan>>; // overload 2
```

## Other Exports (Non-Function)

- `Any` (interface)
- `CurrentMemoMap` (class)
- `empty` (variable)
- `Error` (type)
- `Layer` (interface)
- `makeMemoMap` (variable)
- `MemoMap` (interface)
- `PartialEffectful` (type)
- `Services` (type)
- `SpanOptions` (interface)
- `Success` (type)
- `Variance` (interface)
