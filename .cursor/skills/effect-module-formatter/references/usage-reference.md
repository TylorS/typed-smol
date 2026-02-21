# Usage Reference: effect/Formatter

- Import path: `effect/Formatter`

## What It Is For

Utilities for converting arbitrary JavaScript values into human-readable strings, with support for circular references, redaction, and common JS types that `JSON.stringify` handles poorly.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Formatter } from "effect";

const obj = { name: "Alice", scores: [100, 97] };
console.log(Formatter.format(obj));
// {"name":"Alice","scores":[100,97]}

console.log(Formatter.format(obj, { space: 2 }));
// {
//   "name": "Alice",
//   "scores": [
//     100,
//     97
//   ]
// }
```

## Test Anchors

- `packages/effect/test/Formatter.test.ts`

## Top Symbols In Anchored Tests

- `format` (47)
- `formatJson` (4)
- `Formatter` (2)
