# Usage Reference: effect/unstable/cluster#utilities

- Import path: `effect/unstable/cluster#utilities`

## What It Is For

support utilities and ids. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `utilities` concern for `effect/unstable/cluster`.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { cluster } from "effect/unstable/cluster";

const value = cluster.ShardId();
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `Snowflake` (12)
- `EntityId` (2)
- `ShardId` (2)
