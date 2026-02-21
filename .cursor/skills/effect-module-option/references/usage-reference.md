# Usage Reference: effect/Option

- Import path: `effect/Option`

## What It Is For

The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Equal.test.ts`
- `packages/effect/test/schema/representation/fromASTs.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/Trie.test.ts`
- `packages/effect/test/unstable/sql/SqlSchema.test.ts`

## Top Symbols In Anchored Tests

- `Option` (489)
- `some` (178)
- `pipe` (137)
- `none` (114)
- `as` (48)
- `map` (18)
- `fromIterable` (16)
- `gen` (13)
- `all` (11)
- `andThen` (11)
- `bind` (11)
- `bindTo` (11)
- `flatMapNullishOr` (10)
- `liftPredicate` (9)
- `containsWith` (8)
