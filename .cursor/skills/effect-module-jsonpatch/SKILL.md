---
name: effect-module-jsonpatch
description: Guidance for `effect/JsonPatch` focused on APIs like get, apply, and JsonPatch. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module JsonPatch

## Owned scope

- Owns only `effect/JsonPatch`.
- Source of truth: `packages/effect/src/JsonPatch.ts`.

## What it is for

- JSON Patch operations for transforming JSON documents.

## API quick reference

- `get`
- `apply`
- `JsonPatch`
- `JsonPatchOperation`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as JsonPatch from "effect/JsonPatch"

const oldValue = { name: "Alice", age: 30 }
const newValue = { name: "Alice", age: 31, city: "NYC" }

const patch = JsonPatch.get(oldValue, newValue)
// [{ op: "replace", path: "/age", value: 31 }, { op: "add", path: "/city", value: "NYC" }]

const result = JsonPatch.apply(patch, oldValue)
// { name: "Alice", age: 31, city: "NYC" }
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/JsonPatch.ts`
- Representative tests: `packages/effect/test/JsonPatch.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
