# Usage Reference: effect/unstable/rpc/RpcMessage

- Import path: `effect/unstable/rpc/RpcMessage`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { RpcMessage } from "effect/unstable/rpc/RpcMessage"

const value = RpcMessage.FromClient()
const next = RpcMessage.FromClientEncoded(value)
```

## Test Anchors

- `packages/effect/test/rpc/Rpc.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`

## Top Symbols In Anchored Tests

- `RequestId` (2)
