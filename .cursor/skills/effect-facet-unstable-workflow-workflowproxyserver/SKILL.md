---
name: effect-facet-unstable-workflow-workflowproxyserver
description: Guidance for facet `effect/unstable/workflow/WorkflowProxyServer` focused on APIs like layerHttpApi, layerRpcHandlers, and RpcHandlers. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workflow/WorkflowProxyServer

## Owned scope

- Owns only `effect/unstable/workflow/WorkflowProxyServer`.
- Parent module: `effect/unstable/workflow`.
- Source anchor: `packages/effect/src/unstable/workflow/WorkflowProxyServer.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `layerHttpApi`
- `layerRpcHandlers`
- `RpcHandlers`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { WorkflowProxyServer } from "effect/unstable/workflow/WorkflowProxyServer";

const value = WorkflowProxyServer.layerHttpApi();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workflow-activity` (effect/unstable/workflow/Activity)
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-durabledeferred` (effect/unstable/workflow/DurableDeferred)
  - `effect-facet-unstable-workflow-workflow` (effect/unstable/workflow/Workflow)
  - `effect-facet-unstable-workflow-workflowengine` (effect/unstable/workflow/WorkflowEngine)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
- Parent module ownership belongs to `effect-module-unstable-workflow`.

## Escalate to

- `effect-module-unstable-workflow` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workflow/WorkflowProxyServer.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
