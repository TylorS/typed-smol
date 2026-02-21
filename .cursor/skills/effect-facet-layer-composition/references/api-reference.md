# API Reference: effect/Layer#composition

- Import path: `effect/Layer#composition`
- Source file: `packages/effect/src/Layer.ts`
- Thematic facet: `composition`
- Function exports (callable): 7
- Non-function exports: 3

## Purpose

A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## Key Function Exports

- `buildWithMemoMap`
- `flatMap`
- `makeMemoMapUnsafe`
- `merge`
- `mergeAll`
- `provide`
- `provideMerge`

## All Function Signatures

```ts
export declare const buildWithMemoMap: (memoMap: MemoMap, scope: Scope.Scope): <RIn, E, ROut>(self: Layer<ROut, E, RIn>) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 1
export declare const buildWithMemoMap: <RIn, E, ROut>(self: Layer<ROut, E, RIn>, memoMap: MemoMap, scope: Scope.Scope): Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 2
export declare const flatMap: <A, A2, E2, R2>(f: (context: ServiceMap.ServiceMap<A>) => Layer<A2, E2, R2>): <E, R>(self: Layer<A, E, R>) => Layer<A2, E2 | E, R2 | R>; // overload 1
export declare const flatMap: <A, E, R, A2, E2, R2>(self: Layer<A, E, R>, f: (context: ServiceMap.ServiceMap<A>) => Layer<A2, E2, R2>): Layer<A2, E | E2, R | R2>; // overload 2
export declare const makeMemoMapUnsafe: (): MemoMap;
export declare const merge: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut | ROut2, E | E2, RIn | RIn2>; // overload 1
export declare const merge: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | R>; // overload 2
export declare const merge: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut | ROut2, E | E2, RIn | RIn2>; // overload 3
export declare const merge: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | R>; // overload 4
export declare const mergeAll: <Layers extends [Layer<never, any, any>, ...Array<Layer<never, any, any>>]>(...layers: Layers): Layer<Success<Layers[number]>, Error<Layers[number]>, Services<Layers[number]>>;
export declare const provide: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 1
export declare const provide: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 2
export declare const provide: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 3
export declare const provide: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 4
export declare const provideMerge: <RIn, E, ROut>(that: Layer<ROut, E, RIn>): <RIn2, E2, ROut2>(self: Layer<ROut2, E2, RIn2>) => Layer<ROut | ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 1
export declare const provideMerge: <const Layers extends [Any, ...Array<Any>]>(that: Layers): <A, E, R>(self: Layer<A, E, R>) => Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 2
export declare const provideMerge: <RIn2, E2, ROut2, RIn, E, ROut>(self: Layer<ROut2, E2, RIn2>, that: Layer<ROut, E, RIn>): Layer<ROut | ROut2, E | E2, RIn | Exclude<RIn2, ROut>>; // overload 3
export declare const provideMerge: <A, E, R, const Layers extends [Any, ...Array<Any>]>(self: Layer<A, E, R>, that: Layers): Layer<A | Success<Layers[number]>, E | Error<Layers[number]>, Services<Layers[number]> | Exclude<R, Success<Layers[number]>>>; // overload 4
```

## Other Exports (Non-Function)

- `CurrentMemoMap` (class)
- `makeMemoMap` (variable)
- `MemoMap` (interface)
