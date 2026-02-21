# Usage Reference: effect/unstable/workers/Transferable

- Import path: `effect/unstable/workers/Transferable`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Transferable } from "effect/unstable/workers/Transferable";

const value = Transferable.makeCollector();
const next = Transferable.getterAddAll(value);
```

## Test Anchors

- `packages/effect/test/unstable/workers/WorkerError.test.ts`

## Top Symbols In Anchored Tests

- `schema` (1)
