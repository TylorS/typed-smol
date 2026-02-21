---
name: effect-module-rcref
description: Guidance for `effect/RcRef` focused on APIs like get, make, and RcRef. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module RcRef

## Owned scope

- Owns only `effect/RcRef`.
- Source of truth: `packages/effect/src/RcRef.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `make`
- `RcRef`
- `Variance`
- `invalidate`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Effect, RcRef } from "effect"

// Create an RcRef for a database connection
const createConnectionRef = (connectionString: string) =>
  RcRef.make({
    acquire: Effect.acquireRelease(
      Effect.succeed(`Connected to ${connectionString}`),
      (connection) => Effect.log(`Closing connection: ${connection}`)
    )
  })

// Use the RcRef in multiple operations
const program = Effect.gen(function*() {
  const connectionRef = yield* createConnectionRef("postgres://localhost")

  // Multiple gets will share the same connection
  const connection1 = yield* RcRef.get(connectionRef)
  const connection2 = yield* RcRef.get(connectionRef)

  return [connection1, connection2]
})
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/RcRef.ts`
- Representative tests: `packages/effect/test/RcRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
