---
name: effect-facet-effect-execution
description: Guidance for facet `effect/Effect#execution` focused on APIs like runFork, runSync, and failSync. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Effect#execution

## Owned scope

- Owns only `effect/Effect#execution`.
- Parent module: `effect/Effect`.

## What it is for

- run/runSync/runPromise boundaries. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## API quick reference

- `runFork`
- `runSync`
- `failSync`
- `RunOptions`
- `runPromise`
- `runCallback`
- `runForkWith`
- `runSyncExit`
- `runSyncWith`
- `failCauseSync`
- `runCallbackWith`
- `runPromiseExit`
- `runPromiseExitWith`
- `runPromiseWith`
- `runSyncExitWith`
- `exit`
- `sync`
- `onExit`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `execution` concern for `effect/Effect`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect } from "effect";

// Creating a simple effect
const hello = Effect.succeed("Hello, World!");

// Composing effects
const program = Effect.gen(function* () {
  const message = yield* hello;
  yield* Console.log(message);
  return message.length;
});

// Running the effect
Effect.runPromise(program).then(console.log); // 13
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-effect-composition` (effect/Effect#composition)
  - `effect-facet-effect-concurrency` (effect/Effect#concurrency)
  - `effect-facet-effect-constructors` (effect/Effect#constructors)
  - `effect-facet-effect-context-di` (effect/Effect#context-di)
  - `effect-facet-effect-error-handling` (effect/Effect#error-handling)
  - `effect-facet-effect-resource-scope` (effect/Effect#resource-scope)
- Parent module ownership belongs to `effect-module-effect`.

## Escalate to

- `effect-module-effect` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Effect.test.ts`
- Parent tests: `packages/effect/test/Channel.test.ts`
- Parent tests: `packages/effect/test/Deferred.test.ts`
- Parent tests: `packages/effect/test/Layer.test.ts`
- Parent tests: `packages/effect/test/Logger.test.ts`
- Parent tests: `packages/effect/test/LogLevel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
