# Usage Reference: effect/unstable/rpc/RpcMiddleware

- Import path: `effect/unstable/rpc/RpcMiddleware`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { RpcMiddleware } from "effect/unstable/rpc/RpcMiddleware";

const value = RpcMiddleware.Service();
const next = RpcMiddleware.ErrorServicesDecode(value);
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/rpc/Rpc.test.ts`

## Top Symbols In Anchored Tests

- `Any` (1)
- `Error` (1)
