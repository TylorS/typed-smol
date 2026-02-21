# Usage Reference: effect/unstable/workers/Worker

- Import path: `effect/unstable/workers/Worker`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Worker } from "effect/unstable/workers/Worker"

const value = Worker.makePlatform()
```

## Test Anchors

- `packages/effect/test/unstable/workers/WorkerError.test.ts`

## Top Symbols In Anchored Tests

- `Worker` (2)
