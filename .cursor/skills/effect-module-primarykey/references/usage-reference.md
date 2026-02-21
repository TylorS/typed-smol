# Usage Reference: effect/PrimaryKey

- Import path: `effect/PrimaryKey`

## What It Is For

This module provides functionality for working with primary keys. A `PrimaryKey` is a simple interface that represents a unique identifier that can be converted to a string representation.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
