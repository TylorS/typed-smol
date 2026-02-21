# Usage Reference: effect/unstable/encoding

- Import path: `effect/unstable/encoding`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { encoding } from "effect/unstable/encoding"

const value = encoding.Sse()
```

## Test Anchors

- `packages/effect/test/unstable/encoding/Sse.test.ts`

## Top Symbols In Anchored Tests

- `Sse` (7)
