# Usage Reference: effect/unstable/cluster/Entity

- Import path: `effect/unstable/cluster/Entity`

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
import { Entity } from "effect/unstable/cluster/Entity"

const value = Entity.make()
const next = Entity.CurrentRunnerAddress(value)
```

## Test Anchors

- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `make` (34)
- `Entity` (3)
- `makeTestClient` (2)
- `Success` (2)
