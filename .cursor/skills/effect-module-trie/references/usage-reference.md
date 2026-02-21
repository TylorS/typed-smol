# Usage Reference: effect/Trie

- Import path: `effect/Trie`

## What It Is For

A `Trie` is used for locating specific `string` keys from within a set.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Trie from "effect/Trie"

// Create a trie with string-to-number mappings
const trie: Trie.Trie<number> = Trie.make(
  ["apple", 1],
  ["app", 2],
  ["application", 3],
  ["banana", 4]
)

// Get values by exact key
console.log(Trie.get(trie, "apple")) // Some(1)
console.log(Trie.get(trie, "grape")) // None

// Find all keys with a prefix
console.log(Array.from(Trie.keysWithPrefix(trie, "app")))
// ["app", "apple", "application"]

// Iterate over all entries (sorted alphabetically)
for (const [key, value] of trie) {
  console.log(`${key}: ${value}`)
}
// Output: "app: 2", "apple: 1", "application: 3", "banana: 4"

```

## Test Anchors

- `packages/effect/test/Trie.test.ts`

## Top Symbols In Anchored Tests

- `Trie` (224)
- `insert` (107)
- `empty` (43)
- `get` (18)
- `fromIterable` (13)
- `has` (9)
- `make` (6)
- `longestPrefixOf` (5)
- `keys` (4)
- `reduce` (4)
- `values` (4)
- `filter` (3)
- `filterMap` (3)
- `isEmpty` (3)
- `map` (3)
