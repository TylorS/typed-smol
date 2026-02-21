# API Reference: effect/unstable/cluster/HttpRunner

- Import path: `effect/unstable/cluster/HttpRunner`
- Source file: `packages/effect/src/unstable/cluster/HttpRunner.ts`
- Function exports (callable): 4
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerClientProtocolHttp`
- `layerClientProtocolWebsocket`
- `layerHttpOptions`
- `layerWebsocketOptions`

## All Function Signatures

```ts
export declare const layerClientProtocolHttp: (options: { readonly path: string; readonly https?: boolean | undefined; }): Layer.Layer<RpcClientProtocol, never, RpcSerialization.RpcSerialization | HttpClient.HttpClient>;
export declare const layerClientProtocolWebsocket: (options: { readonly path: string; readonly https?: boolean | undefined; }): Layer.Layer<RpcClientProtocol, never, RpcSerialization.RpcSerialization | Socket.WebSocketConstructor>;
export declare const layerHttpOptions: (options: { readonly path: HttpRouter.PathInput; }): Layer.Layer<Sharding.Sharding | Runners.Runners, never, RunnerStorage | RunnerHealth | RpcSerialization.RpcSerialization | MessageStorage | ShardingConfig.ShardingConfig | Runners.RpcClientProtocol | HttpRouter.HttpRouter>;
export declare const layerWebsocketOptions: (options: { readonly path: HttpRouter.PathInput; }): Layer.Layer<Sharding.Sharding | Runners.Runners, never, ShardingConfig.ShardingConfig | Runners.RpcClientProtocol | MessageStorage | RunnerStorage | RunnerHealth | RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
```

## Other Exports (Non-Function)

- `layerClient` (variable)
- `layerClientProtocolHttpDefault` (variable)
- `layerClientProtocolWebsocketDefault` (variable)
- `layerHttp` (variable)
- `layerHttpClientOnly` (variable)
- `layerWebsocket` (variable)
- `layerWebsocketClientOnly` (variable)
- `toHttpEffect` (variable)
- `toHttpEffectWebsocket` (variable)
