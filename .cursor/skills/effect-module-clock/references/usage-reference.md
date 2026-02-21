# Usage Reference: effect/Clock

- Import path: `effect/Clock`

## What It Is For

The `Clock` module provides functionality for time-based operations in Effect applications. It offers precise time measurements, scheduling capabilities, and controlled time management for testing scenarios.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/cluster/Sharding.test.ts`
- `packages/effect/test/ScopedCache.test.ts`
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `Clock` (11)
- `currentTimeMillis` (6)
