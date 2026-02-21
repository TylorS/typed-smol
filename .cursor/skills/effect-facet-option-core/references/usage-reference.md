# Usage Reference: effect/Option#core

- Import path: `effect/Option#core`

## What It Is For

option model and constructors. The `Option` module provides a type-safe way to represent values that may or may not exist. An `Option<A>` is either `Some<A>` (containing a value) or `None` (representing absence).

## How To Use

- Keep work focused on the `core` concern for `effect/Option`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

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

- `fromIterable` (16)
- `fromNullishOr` (7)
- `getOrThrow` (4)
- `getFailure` (3)
- `getOrElse` (3)
- `getOrNull` (3)
- `getOrThrowWith` (3)
- `getOrUndefined` (3)
- `getSuccess` (3)
- `makeEquivalence` (2)
- `makeOrder` (2)
- `makeReducer` (2)
- `makeReducerFailFast` (2)
