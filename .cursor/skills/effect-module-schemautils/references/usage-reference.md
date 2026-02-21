# Usage Reference: effect/SchemaUtils

- Import path: `effect/SchemaUtils`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SchemaUtils } from "effect/SchemaUtils";

const value = SchemaUtils.getNativeClassSchema();
```

## Test Anchors

- `packages/effect/test/schema/toIso.test.ts`

## Top Symbols In Anchored Tests

- `getNativeClassSchema` (2)
