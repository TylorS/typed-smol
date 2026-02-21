# Usage Reference: effect/unstable/workflow/WorkflowEngine

- Import path: `effect/unstable/workflow/WorkflowEngine`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { WorkflowEngine } from "effect/unstable/workflow/WorkflowEngine";

const value = WorkflowEngine.makeUnsafe();
const next = WorkflowEngine.Encoded(value);
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `WorkflowInstance` (5)
- `makeUnsafe` (1)
- `WorkflowEngine` (1)
