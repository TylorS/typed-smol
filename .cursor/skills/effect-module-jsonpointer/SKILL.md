---
name: effect-module-jsonpointer
description: Guidance for `effect/JsonPointer` focused on APIs like escapeToken and unescapeToken. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module JsonPointer

## Owned scope

- Owns only `effect/JsonPointer`.
- Source of truth: `packages/effect/src/JsonPointer.ts`.

## What it is for

- Utilities for escaping and unescaping JSON Pointer reference tokens according to RFC 6901.

## API quick reference

- `escapeToken`
- `unescapeToken`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { escapeToken, unescapeToken } from "effect/JsonPointer"

// Build a JSON Pointer from path segments
const segments = ["users", "name/alias", "value"]
const pointer = "/" + segments.map(escapeToken).join("/")
// "/users/name~1alias/value"

// Parse a JSON Pointer back to segments
const tokens = pointer.split("/").slice(1).map(unescapeToken)
// ["users", "name/alias", "value"]
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/JsonPointer.ts`
- Representative tests: `packages/effect/test/JsonPointer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
