# Usage Reference: effect/ServiceMap

- Import path: `effect/ServiceMap`

## What It Is For

This module provides a data structure called `ServiceMap` that can be used for dependency injection in effectful programs. It is essentially a table mapping `Service`s identifiers to their implementations, and can be used to manage dependencies in a type-safe way.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { ServiceMap } from "effect"

// Define an identifier for a database service
const Database = ServiceMap.Service<{ query: (sql: string) => string }>(
  "Database"
)

// The key can be used to store and retrieve services
const services = ServiceMap.make(Database, { query: (sql) => `Result: ${sql}` })
```

## Test Anchors

- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/ExecutionPlan.test.ts`
- `packages/effect/test/Formatter.test.ts`

## Top Symbols In Anchored Tests

- `get` (184)
- `make` (134)
- `Service` (24)
- `ServiceMap` (16)
- `empty` (9)
- `getOption` (7)
- `merge` (6)
- `makeUnsafe` (3)
- `getUnsafe` (1)
