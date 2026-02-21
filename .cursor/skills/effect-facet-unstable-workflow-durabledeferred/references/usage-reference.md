# Usage Reference: effect/unstable/workflow/DurableDeferred

- Import path: `effect/unstable/workflow/DurableDeferred`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { DurableDeferred } from "effect/unstable/workflow/DurableDeferred"

const value = DurableDeferred.make()
const next = DurableDeferred.TokenParsed(value)
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `make` (22)
- `DurableDeferred` (13)
- `token` (11)
- `done` (4)
- `raceAll` (4)
- `succeed` (4)
- `await` (3)
- `fail` (2)
- `Token` (1)
