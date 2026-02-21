---
name: effect-facet-unstable-workflow-durabledeferred
description: Guidance for facet `effect/unstable/workflow/DurableDeferred` focused on APIs like fail, make, and succeed. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workflow/DurableDeferred

## Owned scope

- Owns only `effect/unstable/workflow/DurableDeferred`.
- Parent module: `effect/unstable/workflow`.
- Source anchor: `packages/effect/src/unstable/workflow/DurableDeferred.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `fail`
- `make`
- `succeed`
- `failCause`
- `Any`
- `done`
- `into`
- `await`
- `token`
- `Token`
- `raceAll`
- `TokenParsed`
- `TokenTypeId`
- `AnyWithProps`
- `DurableDeferred`
- `tokenFromExecutionId`
- `tokenFromPayload`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { DurableDeferred } from "effect/unstable/workflow/DurableDeferred";

const value = DurableDeferred.make();
const next = DurableDeferred.TokenParsed(value);
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workflow-activity` (effect/unstable/workflow/Activity)
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-workflow` (effect/unstable/workflow/Workflow)
  - `effect-facet-unstable-workflow-workflowengine` (effect/unstable/workflow/WorkflowEngine)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
  - `effect-facet-unstable-workflow-workflowproxyserver` (effect/unstable/workflow/WorkflowProxyServer)
- Parent module ownership belongs to `effect-module-unstable-workflow`.

## Escalate to

- `effect-module-unstable-workflow` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workflow/DurableDeferred.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
