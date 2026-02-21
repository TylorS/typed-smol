---
name: effect-module-unstable-cluster
description: Guidance for `effect/unstable/cluster` focused on APIs like Runner, Runners, and RunnerHealth. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/cluster

## Owned scope

- Owns only `effect/unstable/cluster`.
- Source of truth: `packages/effect/src/unstable/cluster/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Runner`
- `Runners`
- `RunnerHealth`
- `RunnerServer`
- `RunnerAddress`
- `RunnerStorage`
- `Reply`
- `Entity`
- `Message`
- `ShardId`
- `EntityId`
- `Envelope`
- `Sharding`
- `DeliverAt`
- `MachineId`
- `Singleton`
- `Snowflake`
- `EntityType`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { cluster } from "effect/unstable/cluster"

const value = cluster.Runner()
const next = cluster.Runners(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-cluster-clustercron` (effect/unstable/cluster/ClusterCron)
  - `effect-facet-unstable-cluster-clustererror` (effect/unstable/cluster/ClusterError)
  - `effect-facet-unstable-cluster-clustermetrics` (effect/unstable/cluster/ClusterMetrics)
  - `effect-facet-unstable-cluster-clusterschema` (effect/unstable/cluster/ClusterSchema)
  - `effect-facet-unstable-cluster-clusterworkflowengine` (effect/unstable/cluster/ClusterWorkflowEngine)
  - `effect-facet-unstable-cluster-core` (effect/unstable/cluster#core)
  - `effect-facet-unstable-cluster-deliverat` (effect/unstable/cluster/DeliverAt)
  - `effect-facet-unstable-cluster-entity` (effect/unstable/cluster/Entity)
  - `effect-facet-unstable-cluster-entityaddress` (effect/unstable/cluster/EntityAddress)
  - `effect-facet-unstable-cluster-entityid` (effect/unstable/cluster/EntityId)
  - `effect-facet-unstable-cluster-entityproxy` (effect/unstable/cluster/EntityProxy)
  - `effect-facet-unstable-cluster-entityproxyserver` (effect/unstable/cluster/EntityProxyServer)
  - `effect-facet-unstable-cluster-entityresource` (effect/unstable/cluster/EntityResource)
  - `effect-facet-unstable-cluster-entitytype` (effect/unstable/cluster/EntityType)
  - `effect-facet-unstable-cluster-envelope` (effect/unstable/cluster/Envelope)
  - `effect-facet-unstable-cluster-httprunner` (effect/unstable/cluster/HttpRunner)
  - `effect-facet-unstable-cluster-k8shttpclient` (effect/unstable/cluster/K8sHttpClient)
  - `effect-facet-unstable-cluster-machineid` (effect/unstable/cluster/MachineId)
  - `effect-facet-unstable-cluster-message` (effect/unstable/cluster/Message)
  - `effect-facet-unstable-cluster-messagestorage` (effect/unstable/cluster/MessageStorage)
  - plus 24 additional facets listed in `effect-skill-router` references.

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-cluster-clustercron`.

## Reference anchors

- Module source: `packages/effect/src/unstable/cluster/index.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/cluster/Entity.test.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
