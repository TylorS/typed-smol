# Usage Reference: effect/ConfigProvider

- Import path: `effect/ConfigProvider`

## What It Is For

Provides the data source layer for the `Config` module. A `ConfigProvider` knows how to load raw configuration nodes from a backing store (environment variables, JSON objects, `.env` files, file trees) and expose them through a uniform `Node` interface that `Config` schemas consume.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Config, ConfigProvider, Effect } from "effect"

const provider = ConfigProvider.fromEnv({
  env: { APP_PORT: "3000", APP_HOST: "localhost" }
})

const port = Config.number("port")

const program = port.parse(
  provider.pipe(
    ConfigProvider.nested("app"),
    ConfigProvider.constantCase
  )
)

// Effect.runSync(program) // 3000
```

## Test Anchors

- `packages/effect/test/ConfigProvider.test.ts`
- `packages/effect/test/Config.test.ts`
- `packages/effect/test/unstable/cli/Param.test.ts`

## Top Symbols In Anchored Tests

- `ConfigProvider` (394)
- `fromUnknown` (112)
- `fromEnv` (105)
- `makeValue` (80)
- `makeRecord` (36)
- `nested` (13)
- `fromDotEnvContents` (10)
- `layer` (8)
- `makeArray` (7)
- `constantCase` (6)
- `Path` (6)
- `make` (5)
- `orElse` (4)
- `fromDotEnv` (3)
- `mapInput` (3)
