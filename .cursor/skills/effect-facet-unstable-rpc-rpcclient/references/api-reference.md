# API Reference: effect/unstable/rpc/RpcClient

- Import path: `effect/unstable/rpc/RpcClient`
- Source file: `packages/effect/src/unstable/rpc/RpcClient.ts`
- Function exports (callable): 9
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerProtocolHttp`
- `layerProtocolSocket`
- `layerProtocolWorker`
- `make`
- `makeNoSerialization`
- `makeProtocolHttp`
- `makeProtocolSocket`
- `makeProtocolWorker`
- `withHeaders`

## All Function Signatures

```ts
export declare const layerProtocolHttp: (options: { readonly url: string; readonly transformClient?: <E, R>(client: HttpClient.HttpClient.With<E, R>) => HttpClient.HttpClient.With<E, R>; }): Layer.Layer<Protocol, never, RpcSerialization.RpcSerialization | HttpClient.HttpClient>;
export declare const layerProtocolSocket: (options?: { readonly retryTransientErrors?: boolean | undefined; }): Layer.Layer<Protocol, never, Socket.Socket | RpcSerialization.RpcSerialization>;
export declare const layerProtocolWorker: (options: { readonly size: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; } | { readonly minSize: number; readonly maxSize: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; readonly timeToLive: Duration.Input; }): Layer.Layer<Protocol, WorkerError, Worker.WorkerPlatform | Worker.Spawner>;
export declare const make: <Rpcs extends Rpc.Any, const Flatten extends boolean = false>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly generateRequestId?: (() => RequestId) | undefined; readonly disableTracing?: boolean | undefined; readonly flatten?: Flatten | undefined; } | undefined): Effect.Effect<Flatten extends true ? RpcClient.Flat<Rpcs, RpcClientError> : RpcClient<Rpcs, RpcClientError>, never, Protocol | Rpc.MiddlewareClient<Rpcs> | Scope.Scope>;
export declare const makeNoSerialization: <Rpcs extends Rpc.Any, E, const Flatten extends boolean = false>(group: RpcGroup.RpcGroup<Rpcs>, options: { readonly onFromClient: (options: { readonly message: FromClient<Rpcs>; readonly context: ServiceMap.ServiceMap<never>; readonly discard: boolean; }) => Effect.Effect<void, E>; readonly supportsAck?: boolean | undefined; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly generateRequestId?: (() => RequestId) | undefined; readonly disableTracing?: boolean | undefined; readonly flatten?: Flatten | undefined; }): Effect.Effect<{ readonly client: Flatten extends true ? RpcClient.Flat<Rpcs, E> : RpcClient<Rpcs, E>; readonly write: (message: FromServer<Rpcs>) => Effect.Effect<void>; }, never, Scope.Scope | Rpc.MiddlewareClient<Rpcs>>;
export declare const makeProtocolHttp: (client: HttpClient.HttpClient): Effect.Effect<Protocol["Service"], never, RpcSerialization.RpcSerialization>;
export declare const makeProtocolSocket: (options?: { readonly retryTransientErrors?: boolean | undefined; readonly retryPolicy?: Schedule.Schedule<any, Socket.SocketError> | undefined; }): Effect.Effect<Protocol["Service"], never, Scope.Scope | RpcSerialization.RpcSerialization | Socket.Socket>;
export declare const makeProtocolWorker: (options: { readonly size: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; } | { readonly minSize: number; readonly maxSize: number; readonly concurrency?: number | undefined; readonly targetUtilization?: number | undefined; readonly timeToLive: Duration.Input; }): Effect.Effect<Protocol["Service"], WorkerError, Scope.Scope | Worker.WorkerPlatform | Worker.Spawner>;
export declare const withHeaders: (headers: Headers.Input): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const withHeaders: <A, E, R>(effect: Effect.Effect<A, E, R>, headers: Headers.Input): Effect.Effect<A, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `CurrentHeaders` (variable)
- `FromGroup` (type)
- `Protocol` (class)
- `RpcClient` (type)
