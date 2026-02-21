---
name: effect-facet-layer-composition
description: Guidance for facet `effect/Layer#composition` focused on APIs like flatMap, provide, and makeMemoMap. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Layer#composition

## Owned scope

- Owns only `effect/Layer#composition`.
- Parent module: `effect/Layer`.

## What it is for

- merge/provide/andThen graph composition. A `Layer<ROut, E, RIn>` describes how to build one or more services in your application. Services can be injected into effects via `Effect.provideService`. Effects can require services via `Effect.service`.

## API quick reference

- `flatMap`
- `provide`
- `makeMemoMap`
- `provideMerge`
- `makeMemoMapUnsafe`
- `merge`
- `MemoMap`
- `mergeAll`
- `buildWithMemoMap`
- `CurrentMemoMap`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `composition` concern for `effect/Layer`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.

## Starter example

```ts
import { Effect, Layer, ServiceMap } from "effect";

class Database extends ServiceMap.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<string>;
  }
>()("Database") {}

// Create a custom MemoMap for manual layer building
const program = Effect.gen(function* () {
  const memoMap = yield* Layer.makeMemoMap;
  const scope = yield* Effect.scope;

  const dbLayer = Layer.succeed(Database)({
    query: (sql: string) => Effect.succeed("result"),
  });
  const services = yield* Layer.buildWithMemoMap(dbLayer, memoMap, scope);

  return ServiceMap.get(services, Database);
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-layer-building` (effect/Layer#building)
  - `effect-facet-layer-constructors` (effect/Layer#constructors)
  - `effect-facet-layer-memoization` (effect/Layer#memoization)
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
