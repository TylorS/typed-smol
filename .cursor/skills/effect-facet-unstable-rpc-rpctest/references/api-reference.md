# API Reference: effect/unstable/rpc/RpcTest

- Import path: `effect/unstable/rpc/RpcTest`
- Source file: `packages/effect/src/unstable/rpc/RpcTest.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `makeClient`

## All Function Signatures

```ts
export declare const makeClient: <Rpcs extends Rpc.Any, const Flatten extends boolean = false>(group: RpcGroup.RpcGroup<Rpcs>, options?: { readonly flatten?: Flatten | undefined; }): Effect.Effect<Flatten extends true ? RpcClient.RpcClient.Flat<Rpcs> : RpcClient.RpcClient<Rpcs>, never, Scope.Scope | Rpc.ToHandler<Rpcs> | Rpc.Middleware<Rpcs> | Rpc.MiddlewareClient<Rpcs>>;
```

## Other Exports (Non-Function)

- None
