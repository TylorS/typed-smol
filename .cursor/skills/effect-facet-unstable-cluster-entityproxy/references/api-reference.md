# API Reference: effect/unstable/cluster/EntityProxy

- Import path: `effect/unstable/cluster/EntityProxy`
- Source file: `packages/effect/src/unstable/cluster/EntityProxy.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `toHttpApiGroup`
- `toRpcGroup`

## All Function Signatures

```ts
export declare const toHttpApiGroup: <const Name extends string, Type extends string, Rpcs extends Rpc.Any>(name: Name, entity: Entity.Entity<Type, Rpcs>): HttpApiGroup.HttpApiGroup<Name, ConvertHttpApi<Rpcs>>;
export declare const toRpcGroup: <Type extends string, Rpcs extends Rpc.Any>(entity: Entity.Entity<Type, Rpcs>): RpcGroup.RpcGroup<ConvertRpcs<Rpcs, Type>>;
```

## Other Exports (Non-Function)

- `ConvertHttpApi` (type)
- `ConvertRpcs` (type)
