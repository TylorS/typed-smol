# Usage Reference: effect/JsonPatch

- Import path: `effect/JsonPatch`

## What It Is For

JSON Patch operations for transforming JSON documents.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as JsonPatch from "effect/JsonPatch"

const oldValue = { name: "Alice", age: 30 }
const newValue = { name: "Alice", age: 31, city: "NYC" }

const patch = JsonPatch.get(oldValue, newValue)
// [{ op: "replace", path: "/age", value: 31 }, { op: "add", path: "/city", value: "NYC" }]

const result = JsonPatch.apply(patch, oldValue)
// { name: "Alice", age: 31, city: "NYC" }
```

## Test Anchors

- `packages/effect/test/JsonPatch.test.ts`

## Top Symbols In Anchored Tests

- `JsonPatch` (132)
- `apply` (65)
- `get` (64)
