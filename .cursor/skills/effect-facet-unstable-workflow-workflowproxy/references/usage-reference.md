# Usage Reference: effect/unstable/workflow/WorkflowProxy

- Import path: `effect/unstable/workflow/WorkflowProxy`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Layer, Schema } from "effect";
import { RpcServer } from "effect/unstable/rpc";
import { Workflow, WorkflowProxy, WorkflowProxyServer } from "effect/unstable/workflow";

const EmailWorkflow = Workflow.make({
  name: "EmailWorkflow",
  payload: {
    id: Schema.String,
    to: Schema.String,
  },
  idempotencyKey: ({ id }) => id,
});

const myWorkflows = [EmailWorkflow] as const;

// Use WorkflowProxy.toRpcGroup to create a `RpcGroup` from the
// workflows
class MyRpcs extends WorkflowProxy.toRpcGroup(myWorkflows) {}

// Use WorkflowProxyServer.layerRpcHandlers to create a layer that implements
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
