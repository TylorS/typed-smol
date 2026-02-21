---
name: effect-module-unstable-workflow
description: Guidance for `effect/unstable/workflow` focused on APIs like Activity, Workflow, and DurableClock. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/workflow

## Owned scope

- Owns only `effect/unstable/workflow`.
- Source of truth: `packages/effect/src/unstable/workflow/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Activity`
- `Workflow`
- `DurableClock`
- `WorkflowProxy`
- `DurableDeferred`
- `WorkflowEngine`
- `WorkflowProxyServer`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { workflow } from "effect/unstable/workflow";

const value = workflow.Activity();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-workflow-activity` (effect/unstable/workflow/Activity)
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-durabledeferred` (effect/unstable/workflow/DurableDeferred)
  - `effect-facet-unstable-workflow-workflow` (effect/unstable/workflow/Workflow)
  - `effect-facet-unstable-workflow-workflowengine` (effect/unstable/workflow/WorkflowEngine)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
  - `effect-facet-unstable-workflow-workflowproxyserver` (effect/unstable/workflow/WorkflowProxyServer)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-workflow-activity`.

## Reference anchors

- Module source: `packages/effect/src/unstable/workflow/index.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
