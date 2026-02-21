---
name: effect-facet-schedule-timing-strategies
description: Guidance for facet `effect/Schedule#timing-strategies` focused on APIs like cron, fixed, and delays. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Schedule#timing-strategies

## Owned scope

- Owns only `effect/Schedule#timing-strategies`.
- Parent module: `effect/Schedule`.

## What it is for

- jitter/delay/window timing controls. This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## API quick reference

- `cron`
- `fixed`
- `delays`
- `spaced`
- `addDelay`
- `jittered`
- `windowed`
- `exponential`
- `modifyDelay`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `timing-strategies` concern for `effect/Schedule`.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Schedule } from "effect";

// Retry with exponential backoff
const retryPolicy = Schedule.exponential("100 millis", 2.0).pipe(
  Schedule.compose(Schedule.recurs(3)),
);

const program = Effect.gen(function* () {
  // This will retry up to 3 times with exponential backoff
  const result = yield* Effect.retry(Effect.fail("Network error"), retryPolicy);
});

// Repeat on a fixed schedule
const heartbeat = Effect.log("heartbeat").pipe(Effect.repeat(Schedule.spaced("30 seconds")));
```

## Common pitfalls

- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-schedule-collecting` (effect/Schedule#collecting)
  - `effect-facet-schedule-combinators` (effect/Schedule#combinators)
  - `effect-facet-schedule-constructors` (effect/Schedule#constructors)
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
