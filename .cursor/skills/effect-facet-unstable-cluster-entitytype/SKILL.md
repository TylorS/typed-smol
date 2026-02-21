---
name: effect-facet-unstable-cluster-entitytype
description: Guidance for facet `effect/unstable/cluster/EntityType` focused on APIs like make and EntityType. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cluster/EntityType

## Owned scope

- Owns only `effect/unstable/cluster/EntityType`.
- Parent module: `effect/unstable/cluster`.
- Source anchor: `packages/effect/src/unstable/cluster/EntityType.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `EntityType`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { EntityType } from "effect/unstable/cluster/EntityType";

const value = EntityType.make();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
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
  - `effect-facet-unstable-cluster-envelope` (effect/unstable/cluster/Envelope)
  - plus 29 additional sibling facets.
- Parent module ownership belongs to `effect-module-unstable-cluster`.

## Escalate to

- `effect-module-unstable-cluster` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cluster/EntityType.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Parent tests: `packages/effect/test/cluster/Entity.test.ts`
- Parent tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Parent tests: `packages/effect/test/cluster/Sharding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
