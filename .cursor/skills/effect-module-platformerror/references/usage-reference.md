# Usage Reference: effect/PlatformError

- Import path: `effect/PlatformError`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { PlatformError } from "effect/PlatformError"

const value = PlatformError.badArgument()
```

## Test Anchors

- `packages/effect/test/unstable/process/ChildProcess.test.ts`
- `packages/effect/test/ConfigProvider.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Primitive.test.ts`

## Top Symbols In Anchored Tests

- `PlatformError` (13)
- `badArgument` (4)
- `systemError` (2)
