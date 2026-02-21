---
name: effect-module-undefinedor
description: Guidance for `effect/UndefinedOr` focused on APIs like map, getOrThrow, and makeReducer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module UndefinedOr

## Owned scope

- Owns only `effect/UndefinedOr`.
- Source of truth: `packages/effect/src/UndefinedOr.ts`.

## What it is for

- This module provides small, allocation-free utilities for working with values of type `A | undefined`, where `undefined` means "no value".

## API quick reference

- `map`
- `getOrThrow`
- `makeReducer`
- `getOrThrowWith`
- `makeCombinerFailFast`
- `makeReducerFailFast`
- `match`
- `liftThrowable`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { UndefinedOr } from "effect/UndefinedOr"

const value = UndefinedOr.makeReducer()
const next = UndefinedOr.map(value)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/UndefinedOr.ts`
- Representative tests: `packages/effect/test/UndefinedOr.test.ts`
- Representative tests: `packages/effect/test/DateTime.test.ts`
- Representative tests: `packages/effect/test/Deferred.test.ts`
- Representative tests: `packages/effect/test/Struct.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
