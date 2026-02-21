# Usage Reference: effect/BigDecimal

- Import path: `effect/BigDecimal`

## What It Is For

This module provides utility functions and type class instances for working with the `BigDecimal` type in TypeScript. It includes functions for basic arithmetic operations.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { BigDecimal } from "effect";

const d = BigDecimal.fromNumberUnsafe(123.45);

d.value; // 12345n
d.scale; // 2
```

## Test Anchors

- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toEquivalence.test.ts`
- `packages/effect/test/schema/toFormatter.test.ts`

## Top Symbols In Anchored Tests

- `BigDecimal` (361)
- `make` (335)
- `format` (209)
- `round` (81)
- `scale` (77)
- `equals` (48)
- `between` (30)
- `fromStringUnsafe` (29)
- `fromString` (24)
- `floor` (19)
- `ceil` (18)
- `isGreaterThan` (18)
- `Equivalence` (15)
- `roundTerminal` (14)
- `Order` (12)
