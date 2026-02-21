# Usage Reference: effect/unstable/rpc/RpcServer

- Import path: `effect/unstable/rpc/RpcServer`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { RpcServer } from "effect/unstable/rpc/RpcServer"

const value = RpcServer.make()
const next = RpcServer.layerProtocolWorkerRunner(value)
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/rpc/Rpc.test.ts`

## Top Symbols In Anchored Tests

- `make` (12)
