# Usage Reference: effect/RegExp

- Import path: `effect/RegExp`

## What It Is For

This module provides utility functions for working with RegExp in TypeScript.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { RegExp } from "effect";

// Create a regular expression using Effect's RegExp constructor
const pattern = new RegExp.RegExp("hello", "i");

// Test the pattern
console.log(pattern.test("Hello World")); // true
console.log(pattern.test("goodbye")); // false
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
