# Usage Reference: effect/unstable/rpc/RpcClient

- Import path: `effect/unstable/rpc/RpcClient`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { RpcClient } from "effect/unstable/rpc/RpcClient"

const value = RpcClient.From()
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/rpc/Rpc.test.ts`

## Top Symbols In Anchored Tests

- `make` (12)
