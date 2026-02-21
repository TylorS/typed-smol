# API Reference: effect/unstable/rpc/RpcGroup

- Import path: `effect/unstable/rpc/RpcGroup`
- Source file: `packages/effect/src/unstable/rpc/RpcGroup.ts`
- Function exports (callable): 1
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: <const Rpcs extends ReadonlyArray<Rpc.Any>>(...rpcs: Rpcs): RpcGroup<Rpcs[number]>;
```

## Other Exports (Non-Function)

- `Any` (interface)
- `HandlerFrom` (type)
- `HandlerServices` (type)
- `HandlersFrom` (type)
- `HandlersServices` (type)
- `RpcGroup` (interface)
- `Rpcs` (type)
