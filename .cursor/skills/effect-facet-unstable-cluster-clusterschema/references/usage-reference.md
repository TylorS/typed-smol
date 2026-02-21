# Usage Reference: effect/unstable/cluster/ClusterSchema

- Import path: `effect/unstable/cluster/ClusterSchema`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { ClusterSchema } from "effect/unstable/cluster/ClusterSchema"

const value = ClusterSchema.isUninterruptibleForClient()
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
