---
name: effect-facet-unstable-workflow-workflow
description: Guidance for facet `effect/unstable/workflow/Workflow` focused on APIs like make, provideScope, and isResult. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workflow/Workflow

## Owned scope

- Owns only `effect/unstable/workflow/Workflow`.
- Parent module: `effect/unstable/workflow`.
- Source anchor: `packages/effect/src/unstable/workflow/Workflow.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `provideScope`
- `isResult`
- `Any`
- `scope`
- `Result`
- `suspend`
- `Complete`
- `Workflow`
- `Execution`
- `Suspended`
- `intoResult`
- `addFinalizer`
- `AnyWithProps`
- `PayloadSchema`
- `ResultEncoded`
- `AnyStructSchema`
- `CaptureDefects`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Workflow } from "effect/unstable/workflow/Workflow";

const value = Workflow.make();
const next = Workflow.ResultEncoded(value);
```

## Common pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workflow-activity` (effect/unstable/workflow/Activity)
  - `effect-facet-unstable-workflow-durableclock` (effect/unstable/workflow/DurableClock)
  - `effect-facet-unstable-workflow-durabledeferred` (effect/unstable/workflow/DurableDeferred)
  - `effect-facet-unstable-workflow-workflowengine` (effect/unstable/workflow/WorkflowEngine)
  - `effect-facet-unstable-workflow-workflowproxy` (effect/unstable/workflow/WorkflowProxy)
  - `effect-facet-unstable-workflow-workflowproxyserver` (effect/unstable/workflow/WorkflowProxyServer)
- Parent module ownership belongs to `effect-module-unstable-workflow`.

## Escalate to

- `effect-module-unstable-workflow` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workflow/Workflow.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
