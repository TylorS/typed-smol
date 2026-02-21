# Usage Reference: effect/unstable/workflow/Workflow

- Import path: `effect/unstable/workflow/Workflow`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Workflow } from "effect/unstable/workflow/Workflow"

const value = Workflow.make()
const next = Workflow.ResultEncoded(value)
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `make` (22)
- `Workflow` (12)
- `addFinalizer` (5)
- `Complete` (2)
- `suspend` (2)
- `SuspendOnFailure` (2)
- `withCompensation` (2)
- `ResultEncoded` (1)
