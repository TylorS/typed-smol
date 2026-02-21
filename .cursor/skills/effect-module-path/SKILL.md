---
name: effect-module-path
description: Guidance for `effect/Path` focused on APIs like layer, Parsed, and Path. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Path

## Owned scope

- Owns only `effect/Path`.
- Source of truth: `packages/effect/src/Path.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `layer`
- `Parsed`
- `Path`
- `TypeId`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Path.ts`
- Representative tests: `packages/effect/test/ConfigProvider.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Help.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/LogLevel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
