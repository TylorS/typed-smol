# Usage Reference: effect/RcMap

- Import path: `effect/RcMap`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, RcMap } from "effect"

Effect.gen(function*() {
  // Create an RcMap that manages database connections
  const dbConnectionMap = yield* RcMap.make({
    lookup: (dbName: string) =>
      Effect.acquireRelease(
        Effect.succeed(`Connection to ${dbName}`),
        (conn) => Effect.log(`Closing ${conn}`)
      ),
    capacity: 10,
    idleTimeToLive: "5 minutes"
  })

  // The RcMap interface provides access to:
  // - lookup: Function to acquire resources
  // - capacity: Maximum number of resources
  // - idleTimeToLive: Time before idle resources are released
  // - state: Current state of the map

  console.log(`Capacity: ${dbConnectionMap.capacity}`)
}).pipe(Effect.scoped)
```

## Test Anchors

- `packages/effect/test/RcMap.test.ts`

## Top Symbols In Anchored Tests

- `RcMap` (40)
- `get` (25)
- `make` (12)
- `touch` (4)
- `keys` (2)
- `invalidate` (1)
