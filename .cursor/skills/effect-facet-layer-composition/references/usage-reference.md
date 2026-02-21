# Usage Reference: effect/Layer#composition

- Import path: `effect/Layer#composition`

## What It Is For

merge/provide/andThen graph composition. A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## How To Use

- Keep work focused on the `composition` concern for `effect/Layer`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Layer, ServiceMap } from "effect"

class Database extends ServiceMap.Service<Database, {
  readonly query: (sql: string) => Effect.Effect<string>
}>()("Database") {}

// Create a custom MemoMap for manual layer building
const program = Effect.gen(function*() {
  const memoMap = yield* Layer.makeMemoMap
  const scope = yield* Effect.scope

  const dbLayer = Layer.succeed(Database)({
    query: (sql: string) => Effect.succeed("result")
  })
  const services = yield* Layer.buildWithMemoMap(dbLayer, memoMap, scope)

  return ServiceMap.get(services, Database)
})
```

## Test Anchors

- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/Logger.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`

## Top Symbols In Anchored Tests

- `provide` (25)
- `merge` (16)
- `buildWithMemoMap` (5)
- `makeMemoMapUnsafe` (2)
- `provideMerge` (2)
- `MemoMap` (1)
