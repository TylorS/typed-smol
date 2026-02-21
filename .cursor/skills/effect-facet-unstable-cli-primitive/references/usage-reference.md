# Usage Reference: effect/unstable/cli/Primitive

- Import path: `effect/unstable/cli/Primitive`

## What It Is For

Primitive types for CLI parameter parsing.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import { Primitive } from "effect/unstable/cli";

// Using built-in primitives
const parseString = Effect.gen(function* () {
  const stringResult = yield* Primitive.string.parse("hello");
  const numberResult = yield* Primitive.integer.parse("42");
  const boolResult = yield* Primitive.boolean.parse("true");

  return { stringResult, numberResult, boolResult };
});

// All primitives provide parsing functionality
const parseDate = Effect.gen(function* () {
  const dateResult = yield* Primitive.date.parse("2023-12-25");
  const pathResult = yield* Primitive.path("file", true).parse("./package.json");
  return { dateResult, pathResult };
});
```

## Test Anchors

- `packages/effect/test/unstable/cli/Primitive.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`

## Top Symbols In Anchored Tests

- `string` (68)
- `boolean` (42)
- `integer` (35)
- `path` (33)
- `Primitive` (32)
- `date` (18)
- `choice` (17)
- `float` (8)
- `redacted` (6)
- `none` (4)
- `keyValuePair` (3)
