---
name: effect-facet-stream-constructors
description: Guidance for facet `effect/Stream#constructors` focused on APIs like fail, make, and empty. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Stream#constructors

## Owned scope

- Owns only `effect/Stream#constructors`.
- Parent module: `effect/Stream`.

## What it is for

- stream creation APIs. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `fail`
- `make`
- `empty`
- `succeed`
- `failSync`
- `fromPull`
- `failCause`
- `fromArray`
- `fromQueue`
- `fromArrays`
- `fromEffect`
- `fromPubSub`
- `fromChannel`
- `fromIterable`
- `fromSchedule`
- `failCauseSync`
- `fromArrayEffect`
- `fromAsyncIterable`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `constructors` concern for `effect/Stream`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Console, Effect, Stream } from "effect";

const program = Effect.gen(function* () {
  yield* Stream.make(1, 2, 3).pipe(
    Stream.map((n) => n * 2),
    Stream.runForEach((n) => Console.log(n)),
  );
});

Effect.runPromise(program);
// Output:
// 2
// 4
// 6
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-stream-combinators` (effect/Stream#combinators)
  - `effect-facet-stream-concurrency` (effect/Stream#concurrency)
  - `effect-facet-stream-runtime` (effect/Stream#runtime)
  - `effect-facet-stream-transforms` (effect/Stream#transforms)
- Parent module ownership belongs to `effect-module-stream`.

## Escalate to

- `effect-module-stream` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Stream.test.ts`
- Parent tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
