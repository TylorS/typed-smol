# Usage Reference: effect/RcRef

- Import path: `effect/RcRef`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, RcRef } from "effect";

// Create an RcRef for a database connection
const createConnectionRef = (connectionString: string) =>
  RcRef.make({
    acquire: Effect.acquireRelease(
      Effect.succeed(`Connected to ${connectionString}`),
      (connection) => Effect.log(`Closing connection: ${connection}`),
    ),
  });

// Use the RcRef in multiple operations
const program = Effect.gen(function* () {
  const connectionRef = yield* createConnectionRef("postgres://localhost");

  // Multiple gets will share the same connection
  const connection1 = yield* RcRef.get(connectionRef);
  const connection2 = yield* RcRef.get(connectionRef);

  return [connection1, connection2];
});
```

## Test Anchors

- `packages/effect/test/RcRef.test.ts`

## Top Symbols In Anchored Tests

- `RcRef` (13)
- `get` (8)
- `make` (6)
