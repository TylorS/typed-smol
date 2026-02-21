---
name: effect-facet-option-core
description: Guidance for facet `effect/Option#core` focused on APIs like getOrElse, getOrNull, and makeOrder. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Option#core

## Owned scope

- Owns only `effect/Option#core`.
- Parent module: `effect/Option`.

## What it is for

- option model and constructors. The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## API quick reference

- `getOrElse`
- `getOrNull`
- `makeOrder`
- `fromNullOr`
- `getFailure`
- `getOrThrow`
- `getSuccess`
- `makeReducer`
- `fromIterable`
- `fromNullishOr`
- `fromUndefinedOr`
- `getOrThrowWith`
- `getOrUndefined`
- `makeCombinerFailFast`
- `makeEquivalence`
- `makeReducerFailFast`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `core` concern for `effect/Option`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Option } from "effect";

const name = Option.some("Alice");
const age = Option.none<number>();

// Transform
const upper = Option.map(name, (s) => s.toUpperCase());

// Unwrap with fallback
console.log(Option.getOrElse(upper, () => "unknown"));
// Output: "ALICE"

console.log(Option.getOrElse(age, () => 0));
// Output: 0

// Combine multiple options
const both = Option.all({ name, age });
console.log(Option.isNone(both));
// Output: true
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-option-combinators` (effect/Option#combinators)
  - `effect-facet-option-conversions` (effect/Option#conversions)
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
