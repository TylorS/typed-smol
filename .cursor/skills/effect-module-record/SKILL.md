---
name: effect-module-record
description: Guidance for `effect/Record` focused on APIs like get, map, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Record

## Owned scope

- Owns only `effect/Record`.
- Source of truth: `packages/effect/src/Record.ts`.

## What it is for

- This module provides utility functions for working with records in TypeScript.

## API quick reference

- `get`
- `map`
- `set`
- `empty`
- `filter`
- `mapKeys`
- `getSomes`
- `filterMap`
- `mapEntries`
- `fromEntries`
- `getFailures`
- `getSuccesses`
- `fromIterableBy`
- `fromIterableWith`
- `makeEquivalence`
- `makeReducerIntersection`
- `makeReducerUnion`
- `isSubrecord`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import type { Record } from "effect";

// Creating a readonly record type
type UserRecord = Record.ReadonlyRecord<"name" | "age", string | number>;

const user: UserRecord = {
  name: "John",
  age: 30,
};
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Record.ts`
- Representative tests: `packages/effect/test/Record.test.ts`
- Representative tests: `packages/effect/test/schema/toIso.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
