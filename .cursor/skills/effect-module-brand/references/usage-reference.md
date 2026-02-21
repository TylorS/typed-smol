# Usage Reference: effect/Brand

- Import path: `effect/Brand`

## What It Is For

This module provides types and utility functions to create and work with branded types, which are TypeScript types with an added type tag to prevent accidental usage of a value in the wrong context.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Brand } from "effect/Brand"

const value = Brand.make()
```

## Test Anchors

- `packages/effect/test/Brand.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/schema/Schema.test.ts`

## Top Symbols In Anchored Tests

- `make` (277)
- `check` (156)
- `Brand` (75)
- `all` (30)
- `nominal` (4)
- `Constructor` (2)
- `Unbranded` (2)
- `BrandError` (1)
