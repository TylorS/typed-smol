# Usage Reference: effect/Option#combinators

- Import path: `effect/Option#combinators`

## What It Is For

map/flatMap/filter operations. The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## How To Use

- Keep work focused on the `combinators` concern for `effect/Option`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Equal.test.ts`
- `packages/effect/test/schema/representation/fromASTs.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/Trie.test.ts`
- `packages/effect/test/unstable/sql/SqlSchema.test.ts`

## Top Symbols In Anchored Tests

- `andThen` (11)
- `zipWith` (4)
