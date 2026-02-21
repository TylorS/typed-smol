---
name: effect-module-unstable-workers
description: Guidance for `effect/unstable/workers` focused on APIs like Worker, WorkerError, and Transferable. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/workers

## Owned scope

- Owns only `effect/unstable/workers`.
- Source of truth: `packages/effect/src/unstable/workers/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Worker`
- `WorkerError`
- `Transferable`
- `WorkerRunner`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { workers } from "effect/unstable/workers"

const value = workers.Worker()
const next = workers.WorkerRunner(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-workers-transferable` (effect/unstable/workers/Transferable)
  - `effect-facet-unstable-workers-worker` (effect/unstable/workers/Worker)
  - `effect-facet-unstable-workers-workererror` (effect/unstable/workers/WorkerError)
  - `effect-facet-unstable-workers-workerrunner` (effect/unstable/workers/WorkerRunner)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-workers-transferable`.

## Reference anchors

- Module source: `packages/effect/src/unstable/workers/index.ts`
- Representative tests: `packages/effect/test/unstable/workers/WorkerError.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
