# Usage Reference: effect/unstable/cluster/MessageStorage

- Import path: `effect/unstable/cluster/MessageStorage`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { MessageStorage } from "effect/unstable/cluster/MessageStorage";

const value = MessageStorage.make();
const next = MessageStorage.Encoded(value);
```

## Test Anchors

- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `MessageStorage` (43)
- `make` (34)
- `MemoryDriver` (15)
- `layerMemory` (10)
- `layerNoop` (7)
- `noop` (2)
- `Success` (2)
- `Duplicate` (1)
