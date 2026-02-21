# Usage Reference: effect/unstable/reactivity/Atom

- Import path: `effect/unstable/reactivity/Atom`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Atom } from "effect/unstable/reactivity/Atom";

const value = Atom.make();
const next = Atom.get(value);
```

## Test Anchors

- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/reactivity/AsyncResult.test.ts`

## Top Symbols In Anchored Tests

- `get` (273)
- `Atom` (182)
- `make` (142)
- `set` (82)
- `fn` (57)
- `mount` (38)
- `keepAlive` (28)
- `runtime` (20)
- `refresh` (17)
- `optimistic` (14)
- `initialValue` (9)
- `update` (9)
- `batch` (8)
- `mapResult` (8)
- `map` (6)
