# Usage Reference: effect/UndefinedOr

- Import path: `effect/UndefinedOr`

## What It Is For

This module provides small, allocation-free utilities for working with values of type `A | undefined`, where `undefined` means "no value".

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { UndefinedOr } from "effect/UndefinedOr";

const value = UndefinedOr.makeReducer();
const next = UndefinedOr.map(value);
```

## Test Anchors

- `packages/effect/test/UndefinedOr.test.ts`
- `packages/effect/test/DateTime.test.ts`
- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Struct.test.ts`

## Top Symbols In Anchored Tests

- `map` (10)
- `getOrThrow` (7)
- `makeReducer` (7)
- `getOrThrowWith` (3)
- `liftThrowable` (3)
- `match` (3)
- `makeReducerFailFast` (2)
