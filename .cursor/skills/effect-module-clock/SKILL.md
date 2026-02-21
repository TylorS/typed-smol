---
name: effect-module-clock
description: Guidance for `effect/Clock` focused on APIs like Clock, clockWith, and currentTimeMillis. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Clock

## Owned scope

- Owns only `effect/Clock`.
- Source of truth: `packages/effect/src/Clock.ts`.

## What it is for

- The `Clock` module provides functionality for time-based operations in Effect applications. It offers precise time measurements, scheduling capabilities, and controlled time management for testing scenarios.

## API quick reference

- `Clock`
- `clockWith`
- `currentTimeMillis`
- `currentTimeNanos`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Clock, Effect } from "effect";

// Get current time in milliseconds
const getCurrentTime = Clock.currentTimeMillis;

// Sleep for 1 second
const sleep1Second = Effect.sleep("1 seconds");

// Measure execution time
const measureTime = Effect.gen(function* () {
  const start = yield* Clock.currentTimeMillis;
  yield* Effect.sleep("100 millis");
  const end = yield* Clock.currentTimeMillis;
  return end - start;
});
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Clock.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- Representative tests: `packages/effect/test/ScopedCache.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
