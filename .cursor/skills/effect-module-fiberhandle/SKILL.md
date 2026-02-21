---
name: effect-module-fiberhandle
description: Guidance for `effect/FiberHandle` focused on APIs like get, run, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module FiberHandle

## Owned scope

- Owns only `effect/FiberHandle`.
- Source of truth: `packages/effect/src/FiberHandle.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `run`
- `set`
- `make`
- `runtime`
- `makeRuntime`
- `makeRuntimePromise`
- `runtimePromise`
- `getUnsafe`
- `setUnsafe`
- `isFiberHandle`
- `join`
- `clear`
- `awaitEmpty`
- `FiberHandle`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Effect, Fiber, FiberHandle } from "effect";

Effect.gen(function* () {
  // Create a FiberHandle that can hold fibers producing strings
  const handle = yield* FiberHandle.make<string, never>();

  // The handle can store and manage a single fiber
  const fiber = yield* FiberHandle.run(handle, Effect.succeed("hello"));
  const result = yield* Fiber.await(fiber);
  console.log(result); // "hello"
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/FiberHandle.ts`
- Representative tests: `packages/effect/test/FiberHandle.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
