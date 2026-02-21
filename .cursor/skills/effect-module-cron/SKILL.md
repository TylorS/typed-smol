---
name: effect-module-cron
description: Guidance for `effect/Cron` focused on APIs like make, parse, and parseUnsafe. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Cron

## Owned scope

- Owns only `effect/Cron`.
- Source of truth: `packages/effect/src/Cron.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `parse`
- `parseUnsafe`
- `isCron`
- `Cron`
- `isCronParseError`
- `next`
- `match`
- `equals`
- `sequence`
- `Equivalence`
- `CronParseError`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Cron.ts`
- Representative tests: `packages/effect/test/Cron.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
