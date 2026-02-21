# Usage Reference: effect/unstable/rpc/RpcSchema

- Import path: `effect/unstable/rpc/RpcSchema`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { RpcSchema } from "effect/unstable/rpc/RpcSchema";

const value = RpcSchema.getStreamSchemas();
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/rpc/Rpc.test.ts`

## Top Symbols In Anchored Tests

- `Stream` (1)
