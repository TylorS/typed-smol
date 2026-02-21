---
name: effect-module-option
description: Guidance for `effect/Option` focused on APIs like gen, map, and filter. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Option

## Owned scope

- Owns only `effect/Option`.
- Source of truth: `packages/effect/src/Option.ts`.

## What it is for

- The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## API quick reference

- `gen`
- `map`
- `filter`
- `flatMap`
- `filterMap`
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
- `flatMapNullishOr`
- `fromUndefinedOr`
- `getOrThrowWith`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

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

- Deep module subsets are owned by these facet skills:
  - `effect-facet-option-combinators` (effect/Option#combinators)
  - `effect-facet-option-conversions` (effect/Option#conversions)
  - `effect-facet-option-core` (effect/Option#core)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-option-combinators`.

## Reference anchors

- Module source: `packages/effect/src/Option.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- Representative tests: `packages/effect/test/Equal.test.ts`
- Representative tests: `packages/effect/test/schema/representation/fromASTs.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/Trie.test.ts`
- Representative tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
