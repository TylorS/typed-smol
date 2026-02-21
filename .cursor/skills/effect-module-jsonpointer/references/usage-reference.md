# Usage Reference: effect/JsonPointer

- Import path: `effect/JsonPointer`

## What It Is For

Utilities for escaping and unescaping JSON Pointer reference tokens according to RFC 6901.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/JsonPointer.test.ts`

## Top Symbols In Anchored Tests

- `escapeToken` (64)
- `unescapeToken` (53)
