# Usage Reference: effect/DateTime

- Import path: `effect/DateTime`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { DateTime } from "effect";

// Create a UTC DateTime
const utc: DateTime.DateTime = DateTime.nowUnsafe();

// Create a zoned DateTime
const zoned: DateTime.DateTime = DateTime.makeZonedUnsafe(new Date(), {
  timeZone: "Europe/London",
});
```

## Test Anchors

- `packages/effect/test/DateTime.test.ts`
- `packages/effect/test/schema/toDifferJsonPatch.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/Cron.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`

## Top Symbols In Anchored Tests

- `make` (334)
- `DateTime` (218)
- `makeUnsafe` (63)
- `match` (48)
- `now` (37)
- `formatIsoZoned` (27)
- `between` (23)
- `isGreaterThan` (16)
- `makeZonedUnsafe` (13)
- `zoneMakeNamedUnsafe` (10)
- `isGreaterThanOrEqualTo` (9)
- `makeZonedFromString` (9)
- `startOf` (8)
- `toDateUtc` (8)
- `add` (7)
