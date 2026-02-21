---
name: effect-module-fiberset
description: Guidance for `effect/FiberSet` focused on APIs like run, make, and runtime. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module FiberSet

## Owned scope

- Owns only `effect/FiberSet`.
- Source of truth: `packages/effect/src/FiberSet.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `run`
- `make`
- `runtime`
- `makeRuntime`
- `makeRuntimePromise`
- `runtimePromise`
- `isFiberSet`
- `add`
- `join`
- `size`
- `clear`
- `FiberSet`
- `awaitEmpty`
- `addUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Effect, FiberSet } from "effect"

const program = Effect.gen(function*() {
  const set = yield* FiberSet.make<string, string>()

  // Add fibers to the set
  yield* FiberSet.run(set, Effect.succeed("hello"))
  yield* FiberSet.run(set, Effect.succeed("world"))

  // Wait for all fibers to complete
  yield* FiberSet.awaitEmpty(set)
})
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/FiberSet.ts`
- Representative tests: `packages/effect/test/FiberSet.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
