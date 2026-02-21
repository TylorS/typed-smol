# Usage Reference: effect/unstable/reactivity/AsyncResult

- Import path: `effect/unstable/reactivity/AsyncResult`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { AsyncResult } from "effect/unstable/reactivity/AsyncResult"

const value = AsyncResult.fromExit()
const next = AsyncResult.map(value)
```

## Test Anchors

- `packages/effect/test/reactivity/AsyncResult.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`

## Top Symbols In Anchored Tests

- `AsyncResult` (125)
- `value` (99)
- `waiting` (62)
- `isSuccess` (48)
- `success` (39)
- `isInitial` (13)
- `initial` (12)
- `Schema` (11)
- `error` (10)
- `fail` (8)
- `Initial` (8)
- `map` (6)
- `failure` (4)
- `builder` (3)
- `cause` (2)
