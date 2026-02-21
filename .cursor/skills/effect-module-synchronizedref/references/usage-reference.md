# Usage Reference: effect/SynchronizedRef

- Import path: `effect/SynchronizedRef`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SynchronizedRef } from "effect/SynchronizedRef";

const value = SynchronizedRef.make();
const next = SynchronizedRef.get(value);
```

## Test Anchors

- `packages/effect/test/SynchronizedRef.test.ts`

## Top Symbols In Anchored Tests

- `SynchronizedRef` (22)
- `make` (9)
- `getAndUpdateSomeEffect` (8)
- `get` (5)
- `getAndUpdateEffect` (4)
- `update` (4)
- `updateAndGetEffect` (1)
