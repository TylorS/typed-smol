# API Reference: effect/Effect#composition

- Import path: `effect/Effect#composition`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `composition`
- Function exports (callable): 15
- Non-function exports: 33

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `andThen`
- `flatMap`
- `flatMapEager`
- `map`
- `mapBoth`
- `mapBothEager`
- `mapEager`
- `mapError`
- `mapErrorEager`
- `provide`
- `provideService`
- `provideServiceEffect`
- `provideServices`
- `zip`
- `zipWith`

## All Function Signatures

```ts
export declare const andThen: <A, B, E2, R2>(f: (a: A) => Effect<B, E2, R2>): <E, R>(self: Effect<A, E, R>) => Effect<B, E | E2, R | R2>; // overload 1
export declare const andThen: <B, E2, R2>(f: Effect<B, E2, R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<B, E | E2, R | R2>; // overload 2
export declare const andThen: <A, E, R, B, E2, R2>(self: Effect<A, E, R>, f: (a: A) => Effect<B, E2, R2>): Effect<B, E | E2, R | R2>; // overload 3
export declare const andThen: <A, E, R, B, E2, R2>(self: Effect<A, E, R>, f: Effect<B, E2, R2>): Effect<B, E | E2, R | R2>; // overload 4
export declare const flatMap: <A, B, E1, R1>(f: (a: A) => Effect<B, E1, R1>): <E, R>(self: Effect<A, E, R>) => Effect<B, E1 | E, R1 | R>; // overload 1
export declare const flatMap: <A, E, R, B, E1, R1>(self: Effect<A, E, R>, f: (a: A) => Effect<B, E1, R1>): Effect<B, E | E1, R | R1>; // overload 2
export declare const flatMapEager: <A, B, E2, R2>(f: (a: A) => Effect<B, E2, R2>): <E, R>(self: Effect<A, E, R>) => Effect<B, E | E2, R | R2>; // overload 1
export declare const flatMapEager: <A, E, R, B, E2, R2>(self: Effect<A, E, R>, f: (a: A) => Effect<B, E2, R2>): Effect<B, E | E2, R | R2>; // overload 2
export declare const map: <A, B>(f: (a: A) => B): <E, R>(self: Effect<A, E, R>) => Effect<B, E, R>; // overload 1
export declare const map: <A, E, R, B>(self: Effect<A, E, R>, f: (a: A) => B): Effect<B, E, R>; // overload 2
export declare const mapBoth: <E, E2, A, A2>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): <R>(self: Effect<A, E, R>) => Effect<A2, E2, R>; // overload 1
export declare const mapBoth: <A, E, R, E2, A2>(self: Effect<A, E, R>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): Effect<A2, E2, R>; // overload 2
export declare const mapBothEager: <E, E2, A, A2>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): <R>(self: Effect<A, E, R>) => Effect<A2, E2, R>; // overload 1
export declare const mapBothEager: <A, E, R, E2, A2>(self: Effect<A, E, R>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): Effect<A2, E2, R>; // overload 2
export declare const mapEager: <A, B>(f: (a: A) => B): <E, R>(self: Effect<A, E, R>) => Effect<B, E, R>; // overload 1
export declare const mapEager: <A, E, R, B>(self: Effect<A, E, R>, f: (a: A) => B): Effect<B, E, R>; // overload 2
export declare const mapError: <E, E2>(f: (e: E) => E2): <A, R>(self: Effect<A, E, R>) => Effect<A, E2, R>; // overload 1
export declare const mapError: <A, E, R, E2>(self: Effect<A, E, R>, f: (e: E) => E2): Effect<A, E2, R>; // overload 2
export declare const mapErrorEager: <E, E2>(f: (e: E) => E2): <A, R>(self: Effect<A, E, R>) => Effect<A, E2, R>; // overload 1
export declare const mapErrorEager: <A, E, R, E2>(self: Effect<A, E, R>, f: (e: E) => E2): Effect<A, E2, R>; // overload 2
export declare const provide: <const Layers extends [Layer.Any, ...Array<Layer.Any>]>(layers: Layers, options?: { readonly local?: boolean | undefined; } | undefined): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | Layer.Error<Layers[number]>, Layer.Services<Layers[number]> | Exclude<R, Layer.Success<Layers[number]>>>; // overload 1
export declare const provide: <ROut, E2, RIn>(layer: Layer.Layer<ROut, E2, RIn>, options?: { readonly local?: boolean | undefined; } | undefined): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | E2, RIn | Exclude<R, ROut>>; // overload 2
export declare const provide: <R2>(context: ServiceMap.ServiceMap<R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, R2>>; // overload 3
export declare const provide: <A, E, R, const Layers extends [Layer.Any, ...Array<Layer.Any>]>(self: Effect<A, E, R>, layers: Layers, options?: { readonly local?: boolean | undefined; } | undefined): Effect<A, E | Layer.Error<Layers[number]>, Layer.Services<Layers[number]> | Exclude<R, Layer.Success<Layers[number]>>>; // overload 4
export declare const provide: <A, E, R, ROut, E2, RIn>(self: Effect<A, E, R>, layer: Layer.Layer<ROut, E2, RIn>, options?: { readonly local?: boolean | undefined; } | undefined): Effect<A, E | E2, RIn | Exclude<R, ROut>>; // overload 5
export declare const provide: <A, E, R, R2>(self: Effect<A, E, R>, context: ServiceMap.ServiceMap<R2>): Effect<A, E, Exclude<R, R2>>; // overload 6
export declare const provideService: <I, S>(service: ServiceMap.Service<I, S>): { (implementation: S): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, I>>; <A, E, R>(self: Effect<A, E, R>, implementation: S): Effect<A, E, Exclude<R, I>>; }; // overload 1
export declare const provideService: <I, S>(service: ServiceMap.Service<I, S>, implementation: S): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, I>>; // overload 2
export declare const provideService: <A, E, R, I, S>(self: Effect<A, E, R>, service: ServiceMap.Service<I, S>, implementation: S): Effect<A, E, Exclude<R, I>>; // overload 3
export declare const provideServiceEffect: <I, S, E2, R2>(service: ServiceMap.Service<I, S>, acquire: Effect<S, E2, R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | E2, Exclude<R, I> | R2>; // overload 1
export declare const provideServiceEffect: <A, E, R, I, S, E2, R2>(self: Effect<A, E, R>, service: ServiceMap.Service<I, S>, acquire: Effect<S, E2, R2>): Effect<A, E | E2, Exclude<R, I> | R2>; // overload 2
export declare const provideServices: <XR>(context: ServiceMap.ServiceMap<XR>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, XR>>; // overload 1
export declare const provideServices: <A, E, R, XR>(self: Effect<A, E, R>, context: ServiceMap.ServiceMap<XR>): Effect<A, E, Exclude<R, XR>>; // overload 2
export declare const zip: <A2, E2, R2>(that: Effect<A2, E2, R2>, options?: { readonly concurrent?: boolean | undefined; } | undefined): <A, E, R>(self: Effect<A, E, R>) => Effect<[A, A2], E2 | E, R2 | R>; // overload 1
export declare const zip: <A, E, R, A2, E2, R2>(self: Effect<A, E, R>, that: Effect<A2, E2, R2>, options?: { readonly concurrent?: boolean | undefined; }): Effect<[A, A2], E | E2, R | R2>; // overload 2
export declare const zipWith: <A2, E2, R2, A, B>(that: Effect<A2, E2, R2>, f: (a: A, b: A2) => B, options?: { readonly concurrent?: boolean | undefined; }): <E, R>(self: Effect<A, E, R>) => Effect<B, E2 | E, R2 | R>; // overload 1
export declare const zipWith: <A, E, R, A2, E2, R2, B>(self: Effect<A, E, R>, that: Effect<A2, E2, R2>, f: (a: A, b: A2) => B, options?: { readonly concurrent?: boolean | undefined; }): Effect<B, E2 | E, R2 | R>; // overload 2
```

## Other Exports (Non-Function)

- `All` (namespace)
- `currentParentSpan` (variable)
- `currentSpan` (variable)
- `Effect` (interface)
- `Effectify` (namespace)
- `EffectIterator` (interface)
- `EffectTypeLambda` (interface)
- `EffectUnify` (interface)
- `EffectUnifyIgnore` (interface)
- `Error` (type)
- `fiber` (variable)
- `fiberId` (variable)
- `interrupt` (variable)
- `never` (variable)
- `Repeat` (namespace)
- `Retry` (namespace)
- `retryTransaction` (variable)
- `RunOptions` (interface)
- `scope` (variable)
- `Services` (type)
- `spanAnnotations` (variable)
- `spanLinks` (variable)
- `succeedNone` (variable)
- `Success` (type)
- `TagsWithReason` (type)
- `tracer` (variable)
- `Transaction` (class)
- `undefined` (variable)
- `Variance` (interface)
- `void` (variable)
- `Yieldable` (interface)
- `YieldableClass` (class)
- `yieldNow` (variable)
