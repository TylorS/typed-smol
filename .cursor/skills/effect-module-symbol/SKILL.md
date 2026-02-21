---
name: effect-module-symbol
description: Guidance for `effect/Symbol` focused on APIs like isSymbol. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Symbol

## Owned scope

- Owns only `effect/Symbol`.
- Source of truth: `packages/effect/src/Symbol.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `isSymbol`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as Predicate from "effect/Predicate"
import * as assert from "node:assert"

assert.deepStrictEqual(Predicate.isSymbol(Symbol.for("a")), true)
assert.deepStrictEqual(Predicate.isSymbol("a"), false)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Symbol.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
