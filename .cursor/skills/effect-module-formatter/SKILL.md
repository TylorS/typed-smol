---
name: effect-module-formatter
description: Guidance for `effect/Formatter` focused on APIs like format, Formatter, and formatDate. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Formatter

## Owned scope

- Owns only `effect/Formatter`.
- Source of truth: `packages/effect/src/Formatter.ts`.

## What it is for

- Utilities for converting arbitrary JavaScript values into human-readable strings, with support for circular references, redaction, and common JS types that `JSON.stringify` handles poorly.

## API quick reference

- `format`
- `Formatter`
- `formatDate`
- `formatJson`
- `formatPath`
- `formatPropertyKey`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Formatter } from "effect"

const obj = { name: "Alice", scores: [100, 97] }
console.log(Formatter.format(obj))
// {"name":"Alice","scores":[100,97]}

console.log(Formatter.format(obj, { space: 2 }))
// {
//   "name": "Alice",
//   "scores": [
//     100,
//     97
//   ]
// }
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Formatter.ts`
- Representative tests: `packages/effect/test/Formatter.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
