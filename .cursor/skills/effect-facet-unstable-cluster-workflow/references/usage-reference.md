# Usage Reference: effect/unstable/cluster#workflow

- Import path: `effect/unstable/cluster#workflow`

## What It Is For

cluster workflow engine integration. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `workflow` concern for `effect/unstable/cluster`.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { cluster } from "effect/unstable/cluster"

const value = cluster.ClusterWorkflowEngine()
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `ClusterWorkflowEngine` (3)
