---
name: effect-module-config
description: Guidance for `effect/Config` focused on APIs like map, fail, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Config

## Owned scope

- Owns only `effect/Config`.
- Source of truth: `packages/effect/src/Config.ts`.

## What it is for

- Declarative, schema-driven configuration loading. A `Config<T>` describes how to read and validate a value of type `T` from a `ConfigProvider`. Configs can be composed, transformed, and used directly as Effects.

## API quick reference

- `map`
- `fail`
- `make`
- `succeed`
- `mapOrFail`
- `isConfig`
- `all`
- `int`
- `url`
- `date`
- `port`
- `Port`
- `Wrap`
- `Config`
- `finite`
- `number`
- `option`
- `orElse`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Config.ts`
- Representative tests: `packages/effect/test/Config.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Param.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
