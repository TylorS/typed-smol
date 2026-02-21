---
name: effect-module-unify
description: Guidance for `effect/Unify` focused on APIs like unify, Unify, and typeSymbol. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Unify

## Owned scope

- Owns only `effect/Unify`.
- Source of truth: `packages/effect/src/Unify.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `unify`
- `Unify`
- `typeSymbol`
- `unifySymbol`
- `ignoreSymbol`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Unify } from "effect";

// The unifySymbol is used internally in Effect types
// to enable automatic type unification
declare const effect: {
  readonly [Unify.unifySymbol]?: any;
};
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Unify.ts`
- Representative tests: `packages/effect/test/unstable/http/Multipart.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
