# Usage Reference: effect/unstable/workflow/DurableClock

- Import path: `effect/unstable/workflow/DurableClock`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { DurableClock } from "effect/unstable/workflow/DurableClock";

const value = DurableClock.make();
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `make` (22)
- `sleep` (7)
- `DurableClock` (5)
