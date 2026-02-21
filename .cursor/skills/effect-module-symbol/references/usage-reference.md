# Usage Reference: effect/Symbol

- Import path: `effect/Symbol`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Predicate from "effect/Predicate";
import * as assert from "node:assert";

assert.deepStrictEqual(Predicate.isSymbol(Symbol.for("a")), true);
assert.deepStrictEqual(Predicate.isSymbol("a"), false);
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
