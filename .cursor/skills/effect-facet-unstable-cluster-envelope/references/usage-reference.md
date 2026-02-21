# Usage Reference: effect/unstable/cluster/Envelope

- Import path: `effect/unstable/cluster/Envelope`

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
import { Envelope } from "effect/unstable/cluster/Envelope";

const value = Envelope.makeRequest();
const next = Envelope.Encoded(value);
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `makeRequest` (8)
- `Envelope` (3)
- `primaryKey` (3)
- `Interrupt` (2)
- `AckChunk` (1)
