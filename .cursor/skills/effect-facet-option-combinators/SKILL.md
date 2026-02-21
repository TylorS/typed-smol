---
name: effect-facet-option-combinators
description: Guidance for facet `effect/Option#combinators` focused on APIs like makeCombinerFailFast and andThen. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Option#combinators

## Owned scope

- Owns only `effect/Option#combinators`.
- Parent module: `effect/Option`.

## What it is for

- map/flatMap/filter operations. The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## API quick reference

- `makeCombinerFailFast`
- `andThen`
- `zipLeft`
- `zipWith`
- `composeK`
- `zipRight`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `combinators` concern for `effect/Option`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.

## Starter example

```ts
import { Option } from "effect"

const name = Option.some("Alice")
const age = Option.none<number>()

// Transform
const upper = Option.map(name, (s) => s.toUpperCase())

// Unwrap with fallback
console.log(Option.getOrElse(upper, () => "unknown"))
// Output: "ALICE"

console.log(Option.getOrElse(age, () => 0))
// Output: 0

// Combine multiple options
const both = Option.all({ name, age })
console.log(Option.isNone(both))
// Output: true
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-option-conversions` (effect/Option#conversions)
  - `effect-facet-option-core` (effect/Option#core)
- Parent module ownership belongs to `effect-module-option`.

## Escalate to

- `effect-module-option` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Option.test.ts`
- Parent tests: `packages/effect/test/Equal.test.ts`
- Parent tests: `packages/effect/test/schema/representation/fromASTs.test.ts`
- Parent tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Parent tests: `packages/effect/test/Trie.test.ts`
- Parent tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
