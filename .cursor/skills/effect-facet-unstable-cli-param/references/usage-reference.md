# Usage Reference: effect/unstable/cli/Param

- Import path: `effect/unstable/cli/Param`

## What It Is For

Param is the polymorphic implementation shared by Argument.ts and Flag.ts. The `Kind` type parameter ("argument" | "flag") enables type-safe separation while sharing parsing logic and combinators.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Param from "effect/unstable/cli/Param"

// @internal - this module is not exported publicly

const maybeParam = Param.string(Param.flagKind, "name")

if (Param.isParam(maybeParam)) {
  console.log("This is a Param")
}
```

## Test Anchors

- `packages/effect/test/unstable/cli/Param.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`

## Top Symbols In Anchored Tests

- `string` (71)
- `file` (45)
- `boolean` (39)
- `integer` (32)
- `withDescription` (29)
- `path` (18)
- `choice` (14)
- `directory` (14)
- `optional` (11)
- `withFallbackPrompt` (10)
- `variadic` (9)
- `withAlias` (9)
- `withFallbackConfig` (6)
- `filter` (5)
- `filterMap` (4)
