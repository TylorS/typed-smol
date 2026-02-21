# Usage Reference: effect/unstable/rpc/Rpc

- Import path: `effect/unstable/rpc/Rpc`

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
import { Rpc } from "effect/unstable/rpc/Rpc"

const value = Rpc.make()
```

## Test Anchors

- `packages/effect/test/rpc/Rpc.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`

## Top Symbols In Anchored Tests

- `make` (12)
- `Rpc` (11)
- `Exit` (5)
- `exitSchema` (2)
- `Any` (1)
- `AnyWithProps` (1)
- `Error` (1)
- `Success` (1)
