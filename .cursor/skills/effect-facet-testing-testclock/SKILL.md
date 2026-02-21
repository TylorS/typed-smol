---
name: effect-facet-testing-testclock
description: Guidance for facet `effect/testing/TestClock` focused on APIs like make, layer, and setTime. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet testing/TestClock

## Owned scope

- Owns only `effect/testing/TestClock`.
- Parent module: `effect/testing`.
- Source anchor: `packages/effect/src/testing/TestClock.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `setTime`
- `State`
- `adjust`
- `Options`
- `withLive`
- `TestClock`
- `testClockWith`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Fiber, Option, pipe } from "effect"
import { TestClock } from "effect/testing"
import * as assert from "node:assert"

Effect.gen(function*() {
  const fiber = yield* pipe(
    Effect.sleep("5 minutes"),
    Effect.timeout("1 minute"),
    Effect.forkChild
  )
  yield* TestClock.adjust("1 minute")
  const result = yield* Fiber.join(fiber)
  assert.deepStrictEqual(result, Option.none())
})
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-testing-fastcheck` (effect/testing/FastCheck)
  - `effect-facet-testing-testconsole` (effect/testing/TestConsole)
  - `effect-facet-testing-testschema` (effect/testing/TestSchema)
- Parent module ownership belongs to `effect-module-testing`.

## Escalate to

- `effect-module-testing` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/testing/TestClock.ts`
- Parent tests: `packages/effect/test/TestClock.test.ts`
- Parent tests: `packages/effect/test/Resource.test.ts`
- Parent tests: `packages/effect/test/Array.test.ts`
- Parent tests: `packages/effect/test/BigDecimal.test.ts`
- Parent tests: `packages/effect/test/Cache.test.ts`
- Parent tests: `packages/effect/test/Chunk.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
