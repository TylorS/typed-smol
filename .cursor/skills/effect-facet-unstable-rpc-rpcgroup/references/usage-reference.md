# Usage Reference: effect/unstable/rpc/RpcGroup

- Import path: `effect/unstable/rpc/RpcGroup`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { RpcGroup } from "effect/unstable/rpc/RpcGroup"

const value = RpcGroup.make()
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/rpc/Rpc.test.ts`

## Top Symbols In Anchored Tests

- `make` (12)
- `RpcGroup` (2)
- `Any` (1)
