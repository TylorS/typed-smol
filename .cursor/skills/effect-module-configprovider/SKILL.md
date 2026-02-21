---
name: effect-module-configprovider
description: Guidance for `effect/ConfigProvider` focused on APIs like make, layer, and fromDir. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ConfigProvider

## Owned scope

- Owns only `effect/ConfigProvider`.
- Source of truth: `packages/effect/src/ConfigProvider.ts`.

## What it is for

- Provides the data source layer for the `Config` module. A `ConfigProvider` knows how to load raw configuration nodes from a backing store (environment variables, JSON objects, `.env` files, file trees) and expose them through a uniform `Node` interface that `Config` schemas consume.

## API quick reference

- `make`
- `layer`
- `fromDir`
- `fromEnv`
- `layerAdd`
- `mapInput`
- `makeArray`
- `makeValue`
- `fromDotEnv`
- `makeRecord`
- `fromUnknown`
- `fromDotEnvContents`
- `Node`
- `Path`
- `nested`
- `orElse`
- `SourceError`
- `constantCase`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ConfigProvider.ts`
- Representative tests: `packages/effect/test/ConfigProvider.test.ts`
- Representative tests: `packages/effect/test/Config.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Param.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
