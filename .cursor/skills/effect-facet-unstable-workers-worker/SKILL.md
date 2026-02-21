---
name: effect-facet-unstable-workers-worker
description: Guidance for facet `effect/unstable/workers/Worker` focused on APIs like layerSpawner, makePlatform, and makeUnsafe. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workers/Worker

## Owned scope

- Owns only `effect/unstable/workers/Worker`.
- Parent module: `effect/unstable/workers`.
- Source anchor: `packages/effect/src/unstable/workers/Worker.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `layerSpawner`
- `makePlatform`
- `makeUnsafe`
- `Worker`
- `Spawner`
- `SpawnerFn`
- `PlatformMessage`
- `WorkerPlatform`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Worker } from "effect/unstable/workers/Worker";

const value = Worker.makePlatform();
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workers-transferable` (effect/unstable/workers/Transferable)
  - `effect-facet-unstable-workers-workererror` (effect/unstable/workers/WorkerError)
  - `effect-facet-unstable-workers-workerrunner` (effect/unstable/workers/WorkerRunner)
- Parent module ownership belongs to `effect-module-unstable-workers`.

## Escalate to

- `effect-module-unstable-workers` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workers/Worker.ts`
- Parent tests: `packages/effect/test/unstable/workers/WorkerError.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
