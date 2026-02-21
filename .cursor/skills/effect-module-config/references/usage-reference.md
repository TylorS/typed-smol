# Usage Reference: effect/Config

- Import path: `effect/Config`

## What It Is For

Declarative, schema-driven configuration loading. A `Config<T>` describes how to read and validate a value of type `T` from a `ConfigProvider`. Configs can be composed, transformed, and used directly as Effects.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Config, ConfigProvider, Effect, Schema } from "effect";

const AppConfig = Config.schema(
  Schema.Struct({
    host: Schema.String,
    port: Schema.Int,
  }),
  "app",
);

const provider = ConfigProvider.fromEnv({
  env: { app_host: "localhost", app_port: "8080" },
});

// Effect.runSync(AppConfig.parse(provider))
// { host: "localhost", port: 8080 }
```

## Test Anchors

- `packages/effect/test/Config.test.ts`
- `packages/effect/test/unstable/cli/Param.test.ts`

## Top Symbols In Anchored Tests

- `schema` (171)
- `Config` (156)
- `string` (56)
- `finite` (30)
- `number` (26)
- `boolean` (13)
- `redacted` (10)
- `nonEmptyString` (8)
- `Record` (8)
- `all` (6)
- `Boolean` (5)
- `literal` (5)
- `make` (5)
- `withDefault` (5)
- `date` (4)
