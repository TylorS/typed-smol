# Usage Reference: effect/ScopedRef

- Import path: `effect/ScopedRef`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.

## Starter Example

```ts
import { ScopedRef } from "effect/ScopedRef";

const value = ScopedRef.make();
const next = ScopedRef.get(value);
```

## Test Anchors

- `packages/effect/test/ScopedRef.test.ts`

## Top Symbols In Anchored Tests

- `ScopedRef` (21)
- `set` (13)
- `make` (11)
- `get` (2)
