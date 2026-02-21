# Usage Reference: effect/unstable/cli/Flag

- Import path: `effect/unstable/cli/Flag`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Flag } from "effect/unstable/cli";

const nameFlag = Flag.string("name");
// Usage: --name "John Doe"
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- `Flag` (80)
- `string` (65)
- `file` (52)
- `boolean` (37)
- `integer` (30)
- `withDescription` (29)
- `path` (19)
- `directory` (15)
- `choice` (14)
- `optional` (13)
- `withAlias` (9)
- `filter` (5)
- `filterMap` (4)
- `none` (4)
- `float` (3)
