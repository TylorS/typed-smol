# Usage Reference: effect/unstable/workers

- Import path: `effect/unstable/workers`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { workers } from "effect/unstable/workers";

const value = workers.Worker();
const next = workers.WorkerRunner(value);
```

## Test Anchors

- `packages/effect/test/unstable/workers/WorkerError.test.ts`

## Top Symbols In Anchored Tests

- `WorkerError` (11)
- `Worker` (2)
