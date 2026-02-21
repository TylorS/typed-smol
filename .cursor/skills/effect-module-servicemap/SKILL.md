---
name: effect-module-servicemap
description: Guidance for `effect/ServiceMap` focused on APIs like get, make, and empty. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ServiceMap

## Owned scope

- Owns only `effect/ServiceMap`.
- Source of truth: `packages/effect/src/ServiceMap.ts`.

## What it is for

- This module provides a data structure called `ServiceMap` that can be used for dependency injection in effectful programs. It is essentially a table mapping `Service`s identifiers to their implementations, and can be used to manage dependencies in a type-safe way.

## API quick reference

- `get`
- `make`
- `empty`
- `Service`
- `getOption`
- `getOrElse`
- `ServiceMap`
- `ServiceClass`
- `getOrUndefined`
- `getUnsafe`
- `makeUnsafe`
- `getReferenceUnsafe`
- `isService`
- `isReference`
- `isServiceMap`
- `add`
- `Any`
- `omit`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { ServiceMap } from "effect"

// Define an identifier for a database service
const Database = ServiceMap.Service<{ query: (sql: string) => string }>(
  "Database"
)

// The key can be used to store and retrieve services
const services = ServiceMap.make(Database, { query: (sql) => `Result: ${sql}` })
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ServiceMap.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/ExecutionPlan.test.ts`
- Representative tests: `packages/effect/test/Formatter.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
