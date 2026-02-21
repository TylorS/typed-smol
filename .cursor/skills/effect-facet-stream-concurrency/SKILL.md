---
name: effect-facet-stream-concurrency
description: Guidance for facet `effect/Stream#concurrency` focused on APIs like fromQueue, fromPubSub, and runIntoQueue. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Stream#concurrency

## Owned scope

- Owns only `effect/Stream#concurrency`.
- Parent module: `effect/Stream`.

## What it is for

- buffer/share/debounce/throttle behavior. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `fromQueue`
- `fromPubSub`
- `runIntoQueue`
- `runIntoPubSub`
- `fromPubSubTake`
- `race`
- `raceAll`
- `toQueue`
- `toPubSub`
- `drainFork`
- `toPubSubTake`
- `interruptWhen`
- `partitionQueue`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `concurrency` concern for `effect/Stream`.
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

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-stream-combinators` (effect/Stream#combinators)
  - `effect-facet-stream-constructors` (effect/Stream#constructors)
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
