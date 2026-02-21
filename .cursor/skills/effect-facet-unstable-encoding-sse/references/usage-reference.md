# Usage Reference: effect/unstable/encoding/Sse

- Import path: `effect/unstable/encoding/Sse`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Sse } from "effect/unstable/encoding/Sse";

const value = Sse.makeParser();
const next = Sse.decode(value);
```

## Test Anchors

- `packages/effect/test/unstable/encoding/Sse.test.ts`

## Top Symbols In Anchored Tests

- `decode` (5)
- `Event` (5)
- `decodeDataSchema` (2)
- `encode` (2)
- `EventEncoded` (2)
