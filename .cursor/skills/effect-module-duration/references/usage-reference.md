# Usage Reference: effect/Duration

- Import path: `effect/Duration`

## What It Is For

This module provides utilities for working with durations of time. A `Duration` is an immutable data type that represents a span of time with high precision, supporting operations from nanoseconds to weeks.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Duration } from "effect";

const duration1 = Duration.fromInputUnsafe(1000); // 1000 milliseconds
const duration2 = Duration.fromInputUnsafe("5 seconds");
const duration3 = Duration.fromInputUnsafe([2, 500_000_000]); // 2 seconds and 500ms
```

## Test Anchors

- `packages/effect/test/Duration.test.ts`
- `packages/effect/test/Resource.test.ts`
- `packages/effect/test/TestClock.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/Config.test.ts`

## Top Symbols In Anchored Tests

- `Duration` (872)
- `nanos` (138)
- `millis` (110)
- `seconds` (105)
- `infinity` (98)
- `minutes` (68)
- `negativeInfinity` (52)
- `zero` (48)
- `hours` (35)
- `fromInput` (30)
- `fromInputUnsafe` (30)
- `divideUnsafe` (28)
- `divide` (26)
- `Order` (22)
- `Equivalence` (17)
