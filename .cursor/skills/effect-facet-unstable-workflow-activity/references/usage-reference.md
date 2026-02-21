# Usage Reference: effect/unstable/workflow/Activity

- Import path: `effect/unstable/workflow/Activity`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Activity } from "effect/unstable/workflow/Activity";

const value = Activity.make();
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `make` (22)
- `Activity` (21)
- `idempotencyKey` (7)
- `raceAll` (4)
- `CurrentAttempt` (1)
- `retry` (1)
