# Usage Reference: effect/unstable/cluster

- Import path: `effect/unstable/cluster`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { cluster } from "effect/unstable/cluster";

const value = cluster.Runner();
const next = cluster.Runners(value);
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `MessageStorage` (43)
- `Sharding` (13)
- `Snowflake` (12)
- `ShardingConfig` (11)
- `Runners` (9)
- `Message` (8)
- `Reply` (8)
- `RunnerHealth` (4)
- `RunnerStorage` (4)
- `ClusterWorkflowEngine` (3)
- `Entity` (3)
- `Envelope` (3)
- `EntityAddress` (2)
- `EntityId` (2)
- `EntityType` (2)
