---
name: effect-module-redacted
description: Guidance for `effect/Redacted` focused on APIs like make, makeEquivalence, and isRedacted. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Redacted

## Owned scope

- Owns only `effect/Redacted`.
- Source of truth: `packages/effect/src/Redacted.ts`.

## What it is for

- The Redacted module provides functionality for handling sensitive information securely within your application. By using the `Redacted` data type, you can ensure that sensitive values are not accidentally exposed in logs or error messages.

## API quick reference

- `make`
- `makeEquivalence`
- `isRedacted`
- `value`
- `Value`
- `Redacted`
- `Variance`
- `wipeUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Redacted } from "effect";

// Create a redacted value to protect sensitive information
const apiKey = Redacted.make("secret-key");
const userPassword = Redacted.make("user-password");

// TypeScript will infer the types as Redacted<string>
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Redacted.ts`
- Representative tests: `packages/effect/test/Redacted.test.ts`
- Representative tests: `packages/effect/test/Config.test.ts`
- Representative tests: `packages/effect/test/Formatter.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- Representative tests: `packages/effect/test/schema/toEquivalence.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
