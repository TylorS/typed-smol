# Usage Reference: effect/NullOr

- Import path: `effect/NullOr`

## What It Is For

This module provides small, allocation-free utilities for working with values of type `A | null`, where `null` means "no value".

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { NullOr } from "effect/NullOr"

const value = NullOr.makeReducer()
const next = NullOr.map(value)
```

## Test Anchors

- `packages/effect/test/NullOr.test.ts`

## Top Symbols In Anchored Tests

- `map` (5)
- `getOrThrow` (4)
- `getOrThrowWith` (3)
- `liftThrowable` (3)
- `match` (3)
- `makeReducer` (2)
- `makeReducerFailFast` (2)
