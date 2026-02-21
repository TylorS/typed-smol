---
name: effect-module-trie
description: Guidance for `effect/Trie` focused on APIs like get, map, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Trie

## Owned scope

- Owns only `effect/Trie`.
- Source of truth: `packages/effect/src/Trie.ts`.

## What it is for

- A `Trie` is used for locating specific `string` keys from within a set.

## API quick reference

- `get`
- `map`
- `make`
- `empty`
- `filter`
- `filterMap`
- `fromIterable`
- `getUnsafe`
- `isEmpty`
- `has`
- `keys`
- `size`
- `Trie`
- `insert`
- `modify`
- `reduce`
- `remove`
- `values`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Trie.ts`
- Representative tests: `packages/effect/test/Trie.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
