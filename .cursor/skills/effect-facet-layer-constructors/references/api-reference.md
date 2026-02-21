# API Reference: effect/Layer#constructors

- Import path: `effect/Layer#constructors`
- Source file: `packages/effect/src/Layer.ts`
- Thematic facet: `constructors`
- Function exports (callable): 8
- Non-function exports: 3

## Purpose

A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## Key Function Exports

- `build`
- `buildWithMemoMap`
- `buildWithScope`
- `fromBuild`
- `fromBuildMemo`
- `makeMemoMapUnsafe`
- `succeed`
- `succeedServices`

## All Function Signatures

```ts
export declare const build: <RIn, E, ROut>(self: Layer<ROut, E, RIn>): Effect<ServiceMap.ServiceMap<ROut>, E, RIn | Scope.Scope>;
export declare const buildWithMemoMap: (memoMap: MemoMap, scope: Scope.Scope): <RIn, E, ROut>(self: Layer<ROut, E, RIn>) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 1
export declare const buildWithMemoMap: <RIn, E, ROut>(self: Layer<ROut, E, RIn>, memoMap: MemoMap, scope: Scope.Scope): Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 2
export declare const buildWithScope: (scope: Scope.Scope): <RIn, E, ROut>(self: Layer<ROut, E, RIn>) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 1
export declare const buildWithScope: <RIn, E, ROut>(self: Layer<ROut, E, RIn>, scope: Scope.Scope): Effect<ServiceMap.ServiceMap<ROut>, E, RIn>; // overload 2
export declare const fromBuild: <ROut, E, RIn>(build: (memoMap: MemoMap, scope: Scope.Scope) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>): Layer<ROut, E, RIn>;
export declare const fromBuildMemo: <ROut, E, RIn>(build: (memoMap: MemoMap, scope: Scope.Scope) => Effect<ServiceMap.ServiceMap<ROut>, E, RIn>): Layer<ROut, E, RIn>;
export declare const makeMemoMapUnsafe: (): MemoMap;
export declare const succeed: <I, S>(service: ServiceMap.Service<I, S>): (resource: S) => Layer<I>; // overload 1
export declare const succeed: <I, S>(service: ServiceMap.Service<I, S>, resource: Types.NoInfer<S>): Layer<I>; // overload 2
export declare const succeedServices: <A>(services: ServiceMap.ServiceMap<A>): Layer<A>;
```

## Other Exports (Non-Function)

- `empty` (variable)
- `Layer` (interface)
- `makeMemoMap` (variable)
