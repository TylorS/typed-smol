# API Reference: effect/unstable/rpc/RpcServer

- Import path: `effect/unstable/rpc/RpcServer`
- Source file: `packages/effect/src/unstable/rpc/RpcServer.ts`
- Function exports (callable): 10
- Non-function exports: 11

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `layerHttp`
- `layerProtocolHttp`
- `layerProtocolWebsocket`
- `make`
- `makeNoSerialization`
- `makeProtocolHttp`
- `makeProtocolWebsocket`
- `toHttpEffect`
- `toHttpEffectWebsocket`

## All Function Signatures

```ts
export declare const layer: <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly disableTracing?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly concurrency?: number | "unbounded" | undefined; readonly disableFatalDefects?: boolean | undefined; }): Layer.Layer<never, never, Protocol | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.ServicesServer<Rpcs>>;
export declare const layerHttp: <Rpcs extends Rpc.Any>(options: { readonly group: RpcGroup.RpcGroup<Rpcs>; readonly path: HttpRouter.PathInput; readonly protocol?: "http" | "websocket" | undefined; readonly disableTracing?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly concurrency?: number | "unbounded" | undefined; }): Layer.Layer<never, never, RpcSerialization.RpcSerialization | HttpRouter.HttpRouter | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.ServicesServer<Rpcs>>;
export declare const layerProtocolHttp: (options: { readonly path: HttpRouter.PathInput; }): Layer.Layer<Protocol, never, RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
export declare const layerProtocolWebsocket: (options: { readonly path: HttpRouter.PathInput; }): Layer.Layer<Protocol, never, RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
export declare const make: <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly disableTracing?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly concurrency?: number | "unbounded" | undefined; readonly disableFatalDefects?: boolean | undefined; } | undefined): Effect.Effect<never, never, Protocol | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.ServicesServer<Rpcs>>;
export declare const makeNoSerialization: <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>, options: { readonly onFromServer: (response: FromServer<Rpcs>) => Effect.Effect<void>; readonly disableTracing?: boolean | undefined; readonly disableSpanPropagation?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly disableClientAcks?: boolean | undefined; readonly concurrency?: number | "unbounded" | undefined; readonly disableFatalDefects?: boolean | undefined; }): Effect.Effect<RpcServer<Rpcs>, never, Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Scope.Scope>;
export declare const makeProtocolHttp: (options: { readonly path: HttpRouter.PathInput; }): Effect.Effect<Protocol["Service"], never, RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
export declare const makeProtocolWebsocket: (options: { readonly path: HttpRouter.PathInput; }): Effect.Effect<Protocol["Service"], never, RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
export declare const toHttpEffect: <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly disableTracing?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; } | undefined): Effect.Effect<Effect.Effect<HttpServerResponse.HttpServerResponse, never, Scope.Scope | HttpServerRequest.HttpServerRequest>, never, Scope.Scope | RpcSerialization.RpcSerialization | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.ServicesServer<Rpcs>>;
export declare const toHttpEffectWebsocket: <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly disableTracing?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; } | undefined): Effect.Effect<Effect.Effect<HttpServerResponse.HttpServerResponse, never, Scope.Scope | HttpServerRequest.HttpServerRequest>, never, Scope.Scope | RpcSerialization.RpcSerialization | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.ServicesServer<Rpcs>>;
```

## Other Exports (Non-Function)

- `fiberIdClientInterrupt` (variable)
- `layerProtocolSocketServer` (variable)
- `layerProtocolStdio` (variable)
- `layerProtocolWorkerRunner` (variable)
- `makeProtocolSocketServer` (variable)
- `makeProtocolStdio` (variable)
- `makeProtocolWithHttpEffect` (variable)
- `makeProtocolWithHttpEffectWebsocket` (variable)
- `makeProtocolWorkerRunner` (variable)
- `Protocol` (class)
- `RpcServer` (interface)
