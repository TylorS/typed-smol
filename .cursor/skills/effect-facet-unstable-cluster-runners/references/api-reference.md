# API Reference: effect/unstable/cluster/Runners

- Import path: `effect/unstable/cluster/Runners`
- Source file: `packages/effect/src/unstable/cluster/Runners.ts`
- Function exports (callable): 1
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: (options: Omit<Runners["Service"], "sendLocal" | "notifyLocal">): Effect.Effect<Runners["Service"], never, MessageStorage.MessageStorage | Snowflake.Generator | ShardingConfig | Scope>;
```

## Other Exports (Non-Function)

- `layerNoop` (variable)
- `layerRpc` (variable)
- `makeNoop` (variable)
- `makeRpc` (variable)
- `makeRpcClient` (variable)
- `RpcClient` (interface)
- `RpcClientProtocol` (class)
- `Rpcs` (class)
- `Runners` (class)
