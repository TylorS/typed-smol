---
name: effect-module-primarykey
description: Guidance for `effect/PrimaryKey` focused on APIs like isPrimaryKey, value, and symbol. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module PrimaryKey

## Owned scope

- Owns only `effect/PrimaryKey`.
- Source of truth: `packages/effect/src/PrimaryKey.ts`.

## What it is for

- This module provides functionality for working with primary keys. A `PrimaryKey` is a simple interface that represents a unique identifier that can be converted to a string representation.

## API quick reference

- `isPrimaryKey`
- `value`
- `symbol`
- `PrimaryKey`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { PrimaryKey } from "effect"

class ProductId implements PrimaryKey.PrimaryKey {
  constructor(private category: string, private id: number) {}

  [PrimaryKey.symbol](): string {
    return `${this.category}-${this.id}`
  }
}

const productId = new ProductId("electronics", 42)
console.log(PrimaryKey.value(productId)) // "electronics-42"
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/PrimaryKey.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
