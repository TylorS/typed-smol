# Usage Reference: effect/Cron

- Import path: `effect/Cron`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Cron } from "effect"

// Create a cron that runs at 9 AM on weekdays
const weekdayMorning = Cron.make({
  minutes: [0],
  hours: [9],
  days: [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
```

## Test Anchors

- `packages/effect/test/Cron.test.ts`

## Top Symbols In Anchored Tests

- `Cron` (43)
- `next` (37)
- `match` (31)
- `make` (22)
- `parseUnsafe` (18)
- `sequence` (11)
- `equals` (5)
- `isCronParseError` (4)
- `parse` (4)
- `CronParseError` (3)
- `isCron` (2)
