# API Reference: effect/unstable/reactivity/AtomRpc

- Import path: `effect/unstable/reactivity/AtomRpc`
- Source file: `packages/effect/src/unstable/reactivity/AtomRpc.ts`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Service`

## All Function Signatures

```ts
export declare const Service: <Self>(): <const Id extends string, Rpcs extends Rpc.Any, ER, RM = RpcClient.Protocol | Rpc.MiddlewareClient<NoInfer<Rpcs>> | Rpc.ServicesClient<NoInfer<Rpcs>>>(id: Id, options: { readonly group: RpcGroup.RpcGroup<Rpcs>; readonly protocol: Layer.Layer<Exclude<NoInfer<RM>, Scope>, ER>; readonly spanPrefix?: string | undefined; readonly spanAttributes?: Record<string, unknown> | undefined; readonly generateRequestId?: (() => RequestId) | undefined; readonly disableTracing?: boolean | undefined; readonly makeEffect?: Effect.Effect<RpcClient.RpcClient.Flat<Rpcs, RpcClientError>, never, RM> | undefined; readonly runtime?: Atom.RuntimeFactory | undefined; }) => AtomRpcClient<Self, Id, Rpcs, ER>;
```

## Other Exports (Non-Function)

- `AtomRpcClient` (interface)
