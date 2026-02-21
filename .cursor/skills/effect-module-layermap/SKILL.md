---
name: effect-module-layermap
description: Guidance for `effect/LayerMap` focused on APIs like make, Layers, and Service. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module LayerMap

## Owned scope

- Owns only `effect/LayerMap`.
- Source of truth: `packages/effect/src/LayerMap.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `Layers`
- `Service`
- `LayerMap`
- `Services`
- `fromRecord`
- `Key`
- `Error`
- `Success`
- `TagClass`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Layer, LayerMap, ServiceMap } from "effect"

// Define a service key
const DatabaseService = ServiceMap.Service<{
  readonly query: (sql: string) => Effect.Effect<string>
}>("Database")

// Create a LayerMap that provides different database configurations
const createDatabaseLayerMap = LayerMap.make((env: string) =>
  Layer.succeed(DatabaseService)({
    query: (sql) => Effect.succeed(`${env}: ${sql}`)
  })
)

// Use the LayerMap
const program = Effect.gen(function*() {
  const layerMap = yield* createDatabaseLayerMap

  // Get a layer for a specific environment
  const devLayer = layerMap.get("development")

  // Get services directly
  const services = yield* layerMap.services("production")

```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/LayerMap.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
