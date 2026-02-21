---
name: effect-module-schedule
description: Guidance for `effect/Schedule` focused on APIs like map, fromStep, and fromStepWithMetadata. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Schedule

## Owned scope

- Owns only `effect/Schedule`.
- Source of truth: `packages/effect/src/Schedule.ts`.

## What it is for

- This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## API quick reference

- `map`
- `fromStep`
- `fromStepWithMetadata`
- `isSchedule`
- `the`
- `both`
- `cron`
- `take`
- `fixed`
- `while`
- `delays`
- `during`
- `either`
- `recurs`
- `reduce`
- `spaced`
- `toStep`
- `unfold`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Schedule } from "effect"

// Retry with exponential backoff
const retryPolicy = Schedule.exponential("100 millis", 2.0)
  .pipe(Schedule.compose(Schedule.recurs(3)))

const program = Effect.gen(function*() {
  // This will retry up to 3 times with exponential backoff
  const result = yield* Effect.retry(
    Effect.fail("Network error"),
    retryPolicy
  )
})

// Repeat on a fixed schedule
const heartbeat = Effect.log("heartbeat")
  .pipe(Effect.repeat(Schedule.spaced("30 seconds")))
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-schedule-collecting` (effect/Schedule#collecting)
  - `effect-facet-schedule-combinators` (effect/Schedule#combinators)
  - `effect-facet-schedule-constructors` (effect/Schedule#constructors)
  - `effect-facet-schedule-timing-strategies` (effect/Schedule#timing-strategies)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-schedule-collecting`.

## Reference anchors

- Module source: `packages/effect/src/Schedule.ts`
- Representative tests: `packages/effect/test/Schedule.test.ts`
- Representative tests: `packages/effect/test/Resource.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Pool.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
