---
name: effect-module-platformerror
description: Guidance for `effect/PlatformError` focused on APIs like badArgument, BadArgument, and systemError. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module PlatformError

## Owned scope

- Owns only `effect/PlatformError`.
- Source of truth: `packages/effect/src/PlatformError.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `badArgument`
- `BadArgument`
- `systemError`
- `SystemError`
- `PlatformError`
- `SystemErrorTag`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { PlatformError } from "effect/PlatformError";

const value = PlatformError.badArgument();
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/PlatformError.ts`
- Representative tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Representative tests: `packages/effect/test/ConfigProvider.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Primitive.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
