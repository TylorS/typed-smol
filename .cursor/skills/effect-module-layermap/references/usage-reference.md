# Usage Reference: effect/LayerMap

- Import path: `effect/LayerMap`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
