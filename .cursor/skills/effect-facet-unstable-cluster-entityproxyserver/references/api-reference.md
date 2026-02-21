# API Reference: effect/unstable/cluster/EntityProxyServer

- Import path: `effect/unstable/cluster/EntityProxyServer`
- Source file: `packages/effect/src/unstable/cluster/EntityProxyServer.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerHttpApi`
- `layerRpcHandlers`

## All Function Signatures

```ts
export declare const layerHttpApi: <ApiId extends string, Groups extends HttpApiGroup.Any, Name extends HttpApiGroup.Name<Groups>, Type extends string, Rpcs extends Rpc.Any>(api: HttpApi.HttpApi<ApiId, Groups>, name: Name, entity: Entity.Entity<Type, Rpcs>): Layer.Layer<HttpApiGroup.ApiGroup<ApiId, Name>, never, Sharding | Rpc.ServicesServer<Rpcs>>;
export declare const layerRpcHandlers: <const Type extends string, Rpcs extends Rpc.Any>(entity: Entity.Entity<Type, Rpcs>): Layer.Layer<RpcHandlers<Rpcs, Type>, never, Sharding | Rpc.ServicesServer<Rpcs>>;
```

## Other Exports (Non-Function)

- `RpcHandlers` (type)
