# API Reference: effect/unstable/cluster/Entity

- Import path: `effect/unstable/cluster/Entity`
- Source file: `packages/effect/src/unstable/cluster/Entity.ts`
- Function exports (callable): 5
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromRpcGroup`
- `isEntity`
- `keepAlive`
- `make`
- `makeTestClient`

## All Function Signatures

```ts
export declare const fromRpcGroup: <const Type extends string, Rpcs extends Rpc.Any>(type: Type, protocol: RpcGroup.RpcGroup<Rpcs>): Entity<Type, Rpcs>;
export declare const isEntity: (u: unknown): u is Any;
export declare const keepAlive: (enabled: boolean): Effect.Effect<void, never, Sharding | CurrentAddress>;
export declare const make: <const Type extends string, Rpcs extends ReadonlyArray<Rpc.Any>>(type: Type, protocol: Rpcs): Entity<Type, Rpcs[number]>;
export declare const makeTestClient: <Type extends string, Rpcs extends Rpc.Any, LA, LE, LR>(entity: Entity<Type, Rpcs>, layer: Layer.Layer<LA, LE, LR>): Effect.Effect<(entityId: string) => Effect.Effect<RpcClient.RpcClient<Rpcs>>, LE, Scope | ShardingConfig | Exclude<LR, Sharding> | Rpc.MiddlewareClient<Rpcs>>;
```

## Other Exports (Non-Function)

- `Any` (type)
- `CurrentAddress` (class)
- `CurrentRunnerAddress` (class)
- `Entity` (interface)
- `HandlersFrom` (type)
- `KeepAliveLatch` (class)
- `KeepAliveRpc` (variable)
- `Replier` (interface)
- `Request` (class)
