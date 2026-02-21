# Usage Reference: effect/Redacted

- Import path: `effect/Redacted`

## What It Is For

The Redacted module provides functionality for handling sensitive information securely within your application. By using the `Redacted` data type, you can ensure that sensitive values are not accidentally exposed in logs or error messages.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Redacted } from "effect"

// Create a redacted value to protect sensitive information
const apiKey = Redacted.make("secret-key")
const userPassword = Redacted.make("user-password")

// TypeScript will infer the types as Redacted<string>
```

## Test Anchors

- `packages/effect/test/Redacted.test.ts`
- `packages/effect/test/Config.test.ts`
- `packages/effect/test/Formatter.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`
- `packages/effect/test/schema/toEquivalence.test.ts`

## Top Symbols In Anchored Tests

- `value` (394)
- `make` (335)
- `Redacted` (106)
- `wipeUnsafe` (3)
