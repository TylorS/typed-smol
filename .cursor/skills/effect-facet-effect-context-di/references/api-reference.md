# API Reference: effect/Effect#context-di

- Import path: `effect/Effect#context-di`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `context-di`
- Function exports (callable): 13
- Non-function exports: 1

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `provide`
- `provideService`
- `provideServiceEffect`
- `provideContext`
- `request`
- `requestUnsafe`
- `satisfiesServicesType`
- `service`
- `serviceOption`
- `services`
- `servicesWith`
- `updateService`
- `updateServices`

## All Function Signatures

```ts
export declare const provide: <const Layers extends [Layer.Any, ...Array<Layer.Any>]>(layers: Layers, options?: { readonly local?: boolean | undefined; } | undefined): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | Layer.Error<Layers[number]>, Layer.Services<Layers[number]> | Exclude<R, Layer.Success<Layers[number]>>>; // overload 1
export declare const provide: <ROut, E2, RIn>(layer: Layer.Layer<ROut, E2, RIn>, options?: { readonly local?: boolean | undefined; } | undefined): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | E2, RIn | Exclude<R, ROut>>; // overload 2
export declare const provide: <R2>(context: Context.Context<R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, R2>>; // overload 3
export declare const provide: <A, E, R, const Layers extends [Layer.Any, ...Array<Layer.Any>]>(self: Effect<A, E, R>, layers: Layers, options?: { readonly local?: boolean | undefined; } | undefined): Effect<A, E | Layer.Error<Layers[number]>, Layer.Services<Layers[number]> | Exclude<R, Layer.Success<Layers[number]>>>; // overload 4
export declare const provide: <A, E, R, ROut, E2, RIn>(self: Effect<A, E, R>, layer: Layer.Layer<ROut, E2, RIn>, options?: { readonly local?: boolean | undefined; } | undefined): Effect<A, E | E2, RIn | Exclude<R, ROut>>; // overload 5
export declare const provide: <A, E, R, R2>(self: Effect<A, E, R>, context: Context.Context<R2>): Effect<A, E, Exclude<R, R2>>; // overload 6
export declare const provideService: <I, S>(service: Context.Service<I, S>): { (implementation: S): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, I>>; <A, E, R>(self: Effect<A, E, R>, implementation: S): Effect<A, E, Exclude<R, I>>; }; // overload 1
export declare const provideService: <I, S>(service: Context.Service<I, S>, implementation: S): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, I>>; // overload 2
export declare const provideService: <A, E, R, I, S>(self: Effect<A, E, R>, service: Context.Service<I, S>, implementation: S): Effect<A, E, Exclude<R, I>>; // overload 3
export declare const provideServiceEffect: <I, S, E2, R2>(service: Context.Service<I, S>, acquire: Effect<S, E2, R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E | E2, Exclude<R, I> | R2>; // overload 1
export declare const provideServiceEffect: <A, E, R, I, S, E2, R2>(self: Effect<A, E, R>, service: Context.Service<I, S>, acquire: Effect<S, E2, R2>): Effect<A, E | E2, Exclude<R, I> | R2>; // overload 2
export declare const provideContext: <XR>(context: Context.Context<XR>): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, XR>>; // overload 1
export declare const provideContext: <A, E, R, XR>(self: Effect<A, E, R>, context: Context.Context<XR>): Effect<A, E, Exclude<R, XR>>; // overload 2
export declare const request: <A extends Request.Any, EX = never, RX = never>(resolver: RequestResolver<A> | Effect<RequestResolver<A>, EX, RX>): (self: A) => Effect<Request.Success<A>, Request.Error<A> | EX, Request.Services<A> | RX>; // overload 1
export declare const request: <A extends Request.Any, EX = never, RX = never>(self: A, resolver: RequestResolver<A> | Effect<RequestResolver<A>, EX, RX>): Effect<Request.Success<A>, Request.Error<A> | EX, Request.Services<A> | RX>; // overload 2
export declare const requestUnsafe: <A extends Request.Any>(self: A, options: { readonly resolver: RequestResolver<A>; readonly onExit: (exit: Exit.Exit<Request.Success<A>, Request.Error<A>>) => void; readonly services: Context.Context<never>; }): () => void;
export declare const satisfiesServicesType: <R>(): <A, E, R2 extends R>(effect: Effect<A, E, R2>) => Effect<A, E, R2>;
export declare const service: <I, S>(service: Context.Service<I, S>): Effect<S, never, I>;
export declare const serviceOption: <I, S>(key: Context.Service<I, S>): Effect<Option<S>>;
export declare const services: <R>(): Effect<Context.Context<R>, never, R>;
export declare const servicesWith: <R, A, E, R2>(f: (services: Context.Context<R>) => Effect<A, E, R2>): Effect<A, E, R | R2>;
export declare const updateService: <I, A>(service: Context.Service<I, A>, f: (value: A) => A): <XA, E, R>(self: Effect<XA, E, R>) => Effect<XA, E, R | I>; // overload 1
export declare const updateService: <XA, E, R, I, A>(self: Effect<XA, E, R>, service: Context.Service<I, A>, f: (value: A) => A): Effect<XA, E, R | I>; // overload 2
export declare const updateServices: <R2, R>(f: (services: Context.Context<R2>) => Context.Context<NoInfer<R>>): <A, E>(self: Effect<A, E, R>) => Effect<A, E, R2>; // overload 1
export declare const updateServices: <A, E, R, R2>(self: Effect<A, E, R>, f: (services: Context.Context<R2>) => Context.Context<NoInfer<R>>): Effect<A, E, R2>; // overload 2
```

## Other Exports (Non-Function)

- `Services` (type)
