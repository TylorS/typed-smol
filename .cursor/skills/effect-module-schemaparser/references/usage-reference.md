# Usage Reference: effect/SchemaParser

- Import path: `effect/SchemaParser`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SchemaParser } from "effect/SchemaParser";

const value = SchemaParser.makeEffect();
const next = SchemaParser.run(value);
```

## Test Anchors

- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`

## Top Symbols In Anchored Tests

- `asserts` (1234)
- `is` (27)
- `makeUnsafe` (26)
- `decodeUnknownExit` (5)
- `decodeUnknownPromise` (5)
- `encodeUnknownPromise` (5)
- `decodeUnknownSync` (2)
- `asOption` (1)
- `makeEffect` (1)
