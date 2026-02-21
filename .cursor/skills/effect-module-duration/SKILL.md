---
name: effect-module-duration
description: Guidance for `effect/Duration` focused on APIs like fromInput, fromInputUnsafe, and isZero. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Duration

## Owned scope

- Owns only `effect/Duration`.
- Source of truth: `packages/effect/src/Duration.ts`.

## What it is for

- This module provides utilities for working with durations of time. A `Duration` is an immutable data type that represents a span of time with high precision, supporting operations from nanoseconds to weeks.

## API quick reference

- `fromInput`
- `fromInputUnsafe`
- `isZero`
- `isFinite`
- `isDuration`
- `isLessThan`
- `isNegative`
- `isPositive`
- `abs`
- `isGreaterThan`
- `max`
- `min`
- `sum`
- `days`
- `isGreaterThanOrEqualTo`
- `isLessThanOrEqualTo`
- `Unit`
- `zero`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Duration } from "effect";

const duration1 = Duration.fromInputUnsafe(1000); // 1000 milliseconds
const duration2 = Duration.fromInputUnsafe("5 seconds");
const duration3 = Duration.fromInputUnsafe([2, 500_000_000]); // 2 seconds and 500ms
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Duration.ts`
- Representative tests: `packages/effect/test/Duration.test.ts`
- Representative tests: `packages/effect/test/Resource.test.ts`
- Representative tests: `packages/effect/test/TestClock.test.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/Config.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
