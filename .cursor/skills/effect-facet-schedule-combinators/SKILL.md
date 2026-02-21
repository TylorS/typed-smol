---
name: effect-facet-schedule-combinators
description: Guidance for facet `effect/Schedule#combinators` focused on APIs like andThen, compose, and andThenResult. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Schedule#combinators

## Owned scope

- Owns only `effect/Schedule#combinators`.
- Parent module: `effect/Schedule`.

## What it is for

- compose/andThen/while/until behavior. This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## API quick reference

- `andThen`
- `compose`
- `andThenResult`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `combinators` concern for `effect/Schedule`.
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

- Sibling facets under the same parent are out of scope:
  - `effect-facet-schedule-collecting` (effect/Schedule#collecting)
  - `effect-facet-schedule-constructors` (effect/Schedule#constructors)
  - `effect-facet-schedule-timing-strategies` (effect/Schedule#timing-strategies)
- Parent module ownership belongs to `effect-module-schedule`.

## Escalate to

- `effect-module-schedule` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Schedule.test.ts`
- Parent tests: `packages/effect/test/Resource.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
