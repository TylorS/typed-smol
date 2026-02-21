---
name: effect-module-effect
description: Guidance for `effect/Effect` focused on APIs like gen, map, and fail. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Effect

## Owned scope

- Owns only `effect/Effect`.
- Source of truth: `packages/effect/src/Effect.ts`.

## What it is for

- The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## API quick reference

- `gen`
- `map`
- `fail`
- `filter`
- `flatMap`
- `mapBoth`
- `provide`
- `runFork`
- `runSync`
- `service`
- `succeed`
- `failSync`
- `makeSpan`
- `mapEager`
- `mapError`
- `services`
- `Services`
- `failCause`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
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

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-effect-composition` (effect/Effect#composition)
  - `effect-facet-effect-concurrency` (effect/Effect#concurrency)
  - `effect-facet-effect-constructors` (effect/Effect#constructors)
  - `effect-facet-effect-context-di` (effect/Effect#context-di)
  - `effect-facet-effect-error-handling` (effect/Effect#error-handling)
  - `effect-facet-effect-execution` (effect/Effect#execution)
  - `effect-facet-effect-resource-scope` (effect/Effect#resource-scope)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-effect-composition`.

## Reference anchors

- Module source: `packages/effect/src/Effect.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Deferred.test.ts`
- Representative tests: `packages/effect/test/Layer.test.ts`
- Representative tests: `packages/effect/test/Logger.test.ts`
- Representative tests: `packages/effect/test/LogLevel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
