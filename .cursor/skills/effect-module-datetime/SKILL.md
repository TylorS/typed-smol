---
name: effect-module-datetime
description: Guidance for `effect/DateTime` focused on APIs like make, Offset, and getPart. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module DateTime

## Owned scope

- Owns only `effect/DateTime`.
- Source of truth: `packages/effect/src/DateTime.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `Offset`
- `getPart`
- `setZone`
- `setParts`
- `makeZoned`
- `getPartUtc`
- `setPartsUtc`
- `setZoneNamed`
- `setZoneOffset`
- `layerCurrentZone`
- `layerCurrentZoneLocal`
- `layerCurrentZoneNamed`
- `layerCurrentZoneOffset`
- `makeZonedFromString`
- `mapEpochMillis`
- `setZoneCurrent`
- `makeUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { DateTime } from "effect"

// Create a UTC DateTime
const utc: DateTime.DateTime = DateTime.nowUnsafe()

// Create a zoned DateTime
const zoned: DateTime.DateTime = DateTime.makeZonedUnsafe(new Date(), {
  timeZone: "Europe/London"
})
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/DateTime.ts`
- Representative tests: `packages/effect/test/DateTime.test.ts`
- Representative tests: `packages/effect/test/schema/toDifferJsonPatch.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/Cron.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
