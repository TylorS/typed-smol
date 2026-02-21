---
name: effect-facet-effect-composition
description: Guidance for facet `effect/Effect#composition` focused on APIs like map, flatMap, and mapBoth. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Effect#composition

## Owned scope

- Owns only `effect/Effect#composition`.
- Parent module: `effect/Effect`.

## What it is for

- map/flatMap/zip/all composition APIs. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## API quick reference

- `map`
- `flatMap`
- `mapBoth`
- `provide`
- `mapEager`
- `mapError`
- `flatMapEager`
- `mapBothEager`
- `mapErrorEager`
- `provideService`
- `provideServiceEffect`
- `provideServices`
- `zip`
- `andThen`
- `zipWith`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `composition` concern for `effect/Effect`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect } from "effect"

// Creating a simple effect
const hello = Effect.succeed("Hello, World!")

// Composing effects
const program = Effect.gen(function*() {
  const message = yield* hello
  yield* Console.log(message)
  return message.length
})

// Running the effect
Effect.runPromise(program).then(console.log) // 13
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-effect-concurrency` (effect/Effect#concurrency)
  - `effect-facet-effect-constructors` (effect/Effect#constructors)
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
