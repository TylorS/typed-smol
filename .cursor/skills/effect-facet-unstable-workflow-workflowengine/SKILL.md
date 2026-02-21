---
name: effect-facet-unstable-workflow-workflowengine
description: Guidance for facet `effect/unstable/workflow/WorkflowEngine` focused on APIs like Encoded, makeUnsafe, and WorkflowEngine. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workflow/WorkflowEngine

## Owned scope

- Owns only `effect/unstable/workflow/WorkflowEngine`.
- Parent module: `effect/unstable/workflow`.
- Source anchor: `packages/effect/src/unstable/workflow/WorkflowEngine.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Encoded`
- `makeUnsafe`
- `WorkflowEngine`
- `WorkflowInstance`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { WorkflowEngine } from "effect/unstable/workflow/WorkflowEngine";

const value = WorkflowEngine.makeUnsafe();
const next = WorkflowEngine.Encoded(value);
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workflow-activity` (effect/unstable/workflow/Activity)
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-durabledeferred` (effect/unstable/workflow/DurableDeferred)
  - `effect-facet-unstable-workflow-workflow` (effect/unstable/workflow/Workflow)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
  - `effect-facet-unstable-workflow-workflowproxyserver` (effect/unstable/workflow/WorkflowProxyServer)
- Parent module ownership belongs to `effect-module-unstable-workflow`.

## Escalate to

- `effect-module-unstable-workflow` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workflow/WorkflowEngine.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
