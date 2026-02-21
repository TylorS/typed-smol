---
name: effect-facet-unstable-workers-workererror
description: Guidance for facet `effect/unstable/workers/WorkerError` focused on APIs like isWorkerError, TypeId, and WorkerError. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/workers/WorkerError

## Owned scope

- Owns only `effect/unstable/workers/WorkerError`.
- Parent module: `effect/unstable/workers`.
- Source anchor: `packages/effect/src/unstable/workers/WorkerError.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `isWorkerError`
- `TypeId`
- `WorkerError`
- `WorkerErrorReason`
- `WorkerReceiveError`
- `WorkerSendError`
- `WorkerSpawnError`
- `WorkerUnknownError`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { WorkerError } from "effect/unstable/workers/WorkerError"

const value = WorkerError.isWorkerError()
const next = WorkerError.WorkerUnknownError(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-workers-transferable` (effect/unstable/workers/Transferable)
  - `effect-facet-unstable-workers-worker` (effect/unstable/workers/Worker)
  - `effect-facet-unstable-workers-workerrunner` (effect/unstable/workers/WorkerRunner)
- Parent module ownership belongs to `effect-module-unstable-workers`.

## Escalate to

- `effect-module-unstable-workers` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/workers/WorkerError.ts`
- Parent tests: `packages/effect/test/unstable/workers/WorkerError.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
