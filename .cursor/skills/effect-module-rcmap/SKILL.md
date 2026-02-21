---
name: effect-module-rcmap
description: Guidance for `effect/RcMap` focused on APIs like get, make, and has. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module RcMap

## Owned scope

- Owns only `effect/RcMap`.
- Source of truth: `packages/effect/src/RcMap.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `make`
- `has`
- `keys`
- `Open`
- `Entry`
- `RcMap`
- `State`
- `touch`
- `Closed`
- `invalidate`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Effect, RcMap } from "effect";

Effect.gen(function* () {
  // Create an RcMap that manages database connections
  const dbConnectionMap = yield* RcMap.make({
    lookup: (dbName: string) =>
      Effect.acquireRelease(Effect.succeed(`Connection to ${dbName}`), (conn) =>
        Effect.log(`Closing ${conn}`),
      ),
    capacity: 10,
    idleTimeToLive: "5 minutes",
  });

  // The RcMap interface provides access to:
  // - lookup: Function to acquire resources
  // - capacity: Maximum number of resources
  // - idleTimeToLive: Time before idle resources are released
  // - state: Current state of the map

  console.log(`Capacity: ${dbConnectionMap.capacity}`);
}).pipe(Effect.scoped);
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/RcMap.ts`
- Representative tests: `packages/effect/test/RcMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
