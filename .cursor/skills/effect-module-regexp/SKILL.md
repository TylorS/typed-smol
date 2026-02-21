---
name: effect-module-regexp
description: Guidance for `effect/RegExp` focused on APIs like isRegExp, escape, and RegExp. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module RegExp

## Owned scope

- Owns only `effect/RegExp`.
- Source of truth: `packages/effect/src/RegExp.ts`.

## What it is for

- This module provides utility functions for working with RegExp in TypeScript.

## API quick reference

- `isRegExp`
- `escape`
- `RegExp`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { RegExp } from "effect";

// Create a regular expression using Effect's RegExp constructor
const pattern = new RegExp.RegExp("hello", "i");

// Test the pattern
console.log(pattern.test("Hello World")); // true
console.log(pattern.test("goodbye")); // false
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/RegExp.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
