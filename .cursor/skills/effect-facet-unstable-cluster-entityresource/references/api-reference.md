# API Reference: effect/unstable/cluster/EntityResource

- Import path: `effect/unstable/cluster/EntityResource`
- Source file: `packages/effect/src/unstable/cluster/EntityResource.ts`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `makeK8sPod`

## All Function Signatures

```ts
export declare const make: <A, E, R>(options: { readonly acquire: Effect.Effect<A, E, R>; readonly idleTimeToLive?: Duration.Input | undefined; }): Effect.Effect<EntityResource<A, E>, E, Scope.Scope | Exclude<R, CloseScope> | Sharding | Entity.CurrentAddress>;
export declare const makeK8sPod: (spec: v1.Pod, options?: { readonly idleTimeToLive?: Duration.Input | undefined; } | undefined): Effect.Effect<EntityResource<K8sHttpClient.PodStatus>, never, Scope.Scope | Sharding | Entity.CurrentAddress | K8sHttpClient.K8sHttpClient>;
```

## Other Exports (Non-Function)

- `CloseScope` (class)
- `EntityResource` (interface)
- `TypeId` (type)
