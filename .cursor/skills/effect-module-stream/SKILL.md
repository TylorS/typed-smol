---
name: effect-module-stream
description: Guidance for `effect/Stream` focused on APIs like map, run, and fail. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Stream

## Owned scope

- Owns only `effect/Stream`.
- Source of truth: `packages/effect/src/Stream.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `run`
- `fail`
- `make`
- `empty`
- `filter`
- `runSum`
- `flatMap`
- `mapBoth`
- `provide`
- `runFold`
- `runHead`
- `runLast`
- `succeed`
- `failSync`
- `fromPull`
- `mapAccum`
- `mapArray`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
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

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-stream-combinators` (effect/Stream#combinators)
  - `effect-facet-stream-concurrency` (effect/Stream#concurrency)
  - `effect-facet-stream-constructors` (effect/Stream#constructors)
  - `effect-facet-stream-runtime` (effect/Stream#runtime)
  - `effect-facet-stream-transforms` (effect/Stream#transforms)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-stream-combinators`.

## Reference anchors

- Module source: `packages/effect/src/Stream.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- Representative tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- Representative tests: `packages/effect/test/ExecutionPlan.test.ts`
- Representative tests: `packages/effect/test/HttpClient.test.ts`
- Representative tests: `packages/effect/test/Queue.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
