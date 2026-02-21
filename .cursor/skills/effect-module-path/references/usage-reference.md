# Usage Reference: effect/Path

- Import path: `effect/Path`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Path } from "effect"

const program = Effect.gen(function*() {
  const path = yield* Path.Path

  // Use various path operations
  const joined = path.join("home", "user", "documents")
  const normalized = path.normalize("./path/../to/file.txt")
  const basename = path.basename("/path/to/file.txt")
  const dirname = path.dirname("/path/to/file.txt")
  const extname = path.extname("file.txt")
  const isAbs = path.isAbsolute("/absolute/path")
  const parsed = path.parse("/path/to/file.txt")
  const relative = path.relative("/from/path", "/to/path")
  const resolved = path.resolve("relative", "path")

  console.log({
    joined,
    normalized,
    basename,
    dirname,
    extname,
    isAbs,
    parsed,
```

## Test Anchors

- `packages/effect/test/ConfigProvider.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`
- `packages/effect/test/unstable/cli/LogLevel.test.ts`

## Top Symbols In Anchored Tests

- `layer` (24)
- `Path` (17)
