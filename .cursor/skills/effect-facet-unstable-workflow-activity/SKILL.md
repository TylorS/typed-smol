---
name: effect-facet-unstable-workflow-activity
description: Guidance for facet `effect/unstable/workflow/Activity` focused on APIs like make, Any, and retry. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workflow/Activity

## Owned scope

- Owns only `effect/unstable/workflow/Activity`.
- Parent module: `effect/unstable/workflow`.
- Source anchor: `packages/effect/src/unstable/workflow/Activity.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `Any`
- `retry`
- `raceAll`
- `Activity`
- `AnyWithProps`
- `CurrentAttempt`
- `idempotencyKey`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Activity } from "effect/unstable/workflow/Activity"

const value = Activity.make()
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-durabledeferred` (effect/unstable/workflow/DurableDeferred)
  - `effect-facet-unstable-workflow-workflow` (effect/unstable/workflow/Workflow)
  - `effect-facet-unstable-workflow-workflowengine` (effect/unstable/workflow/WorkflowEngine)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
  - `effect-facet-unstable-workflow-workflowproxyserver` (effect/unstable/workflow/WorkflowProxyServer)
- Parent module ownership belongs to `effect-module-unstable-workflow`.

## Escalate to

- `effect-module-unstable-workflow` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workflow/Activity.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
