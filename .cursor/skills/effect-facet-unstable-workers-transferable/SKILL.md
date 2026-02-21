---
name: effect-facet-unstable-workers-transferable
description: Guidance for facet `effect/unstable/workers/Transferable` focused on APIs like getterAddAll, makeCollector, and makeCollectorUnsafe. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workers/Transferable

## Owned scope

- Owns only `effect/unstable/workers/Transferable`.
- Parent module: `effect/unstable/workers`.
- Source anchor: `packages/effect/src/unstable/workers/Transferable.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `getterAddAll`
- `makeCollector`
- `makeCollectorUnsafe`
- `addAll`
- `schema`
- `Collector`
- `ImageData`
- `Uint8Array`
- `MessagePort`
- `Transferable`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Transferable } from "effect/unstable/workers/Transferable";

const value = Transferable.makeCollector();
const next = Transferable.getterAddAll(value);
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workers-worker` (effect/unstable/workers/Worker)
  - `effect-facet-unstable-workers-workererror` (effect/unstable/workers/WorkerError)
  - `effect-facet-unstable-workers-workerrunner` (effect/unstable/workers/WorkerRunner)
- Parent module ownership belongs to `effect-module-unstable-workers`.

## Escalate to

- `effect-module-unstable-workers` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workers/Transferable.ts`
- Parent tests: `packages/effect/test/unstable/workers/WorkerError.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
