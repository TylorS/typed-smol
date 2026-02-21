---
name: effect-facet-effect-constructors
description: Guidance for facet `effect/Effect#constructors` focused on APIs like fail, succeed, and failSync. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Effect#constructors

## Owned scope

- Owns only `effect/Effect#constructors`.
- Parent module: `effect/Effect`.

## What it is for

- Creation and lifting APIs. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## API quick reference

- `fail`
- `succeed`
- `failSync`
- `makeSpan`
- `failCause`
- `fromOption`
- `fromResult`
- `succeedNone`
- `succeedSome`
- `failCauseSync`
- `fromNullishOr`
- `fromYieldable`
- `makeSpanScoped`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `constructors` concern for `effect/Effect`.
- Start with constructor-style APIs to build values/services before composing operations.
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

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-effect-composition` (effect/Effect#composition)
  - `effect-facet-effect-concurrency` (effect/Effect#concurrency)
  - `effect-facet-effect-context-di` (effect/Effect#context-di)
  - `effect-facet-effect-error-handling` (effect/Effect#error-handling)
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
