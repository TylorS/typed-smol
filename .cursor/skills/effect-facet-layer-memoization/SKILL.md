---
name: effect-facet-layer-memoization
description: Guidance for facet `effect/Layer#memoization` focused on APIs like empty, Layer, and flatMap. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Layer#memoization

## Owned scope

- Owns only `effect/Layer#memoization`.
- Parent module: `effect/Layer`.

## What it is for

- MemoMap/fresh lifecycle behavior. A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## API quick reference

- `empty`
- `Layer`
- `flatMap`
- `provide`
- `succeed`
- `Services`
- `fromBuild`
- `makeMemoMap`
- `provideMerge`
- `fromBuildMemo`
- `updateService`
- `succeedServices`
- `makeMemoMapUnsafe`
- `isLayer`
- `Any`
- `mock`
- `span`
- `sync`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `memoization` concern for `effect/Layer`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-layer-building` (effect/Layer#building)
  - `effect-facet-layer-composition` (effect/Layer#composition)
  - `effect-facet-layer-constructors` (effect/Layer#constructors)
- Parent module ownership belongs to `effect-module-layer`.

## Escalate to

- `effect-module-layer` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Layer.test.ts`
- Parent tests: `packages/effect/test/Logger.test.ts`
- Parent tests: `packages/effect/test/unstable/http/HttpEffect.test.ts`
- Parent tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
