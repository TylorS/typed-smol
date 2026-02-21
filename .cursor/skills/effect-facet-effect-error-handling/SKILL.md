---
name: effect-facet-effect-error-handling
description: Guidance for facet `effect/Effect#error-handling` focused on APIs like fail, failSync, and mapError. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Effect#error-handling

## Owned scope

- Owns only `effect/Effect#error-handling`.
- Parent module: `effect/Effect`.

## What it is for

- catch/match/retry/recover flows. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## API quick reference

- `fail`
- `failSync`
- `mapError`
- `failCause`
- `filterOrElse`
- `filterOrFail`
- `failCauseSync`
- `mapErrorEager`
- `isFailure`
- `Error`
- `match`
- `retry`
- `Retry`
- `catchIf`
- `onError`
- `sandbox`
- `catchTag`
- `logError`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `error-handling` concern for `effect/Effect`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

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

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-effect-composition` (effect/Effect#composition)
  - `effect-facet-effect-concurrency` (effect/Effect#concurrency)
  - `effect-facet-effect-constructors` (effect/Effect#constructors)
  - `effect-facet-effect-context-di` (effect/Effect#context-di)
  - `effect-facet-effect-execution` (effect/Effect#execution)
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
