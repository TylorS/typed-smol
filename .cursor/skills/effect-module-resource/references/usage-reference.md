# Usage Reference: effect/Resource

- Import path: `effect/Resource`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Resource } from "effect/Resource";

const value = Resource.get();
```

## Test Anchors

- `packages/effect/test/Resource.test.ts`

## Top Symbols In Anchored Tests

- `Resource` (13)
- `get` (9)
- `auto` (3)
- `manual` (2)
- `refresh` (2)
