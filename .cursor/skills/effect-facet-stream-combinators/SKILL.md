---
name: effect-facet-stream-combinators
description: Guidance for facet `effect/Stream#combinators` focused on its core API surface. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Stream#combinators

## Owned scope

- Owns only `effect/Stream#combinators`.
- Parent module: `effect/Stream`.

## What it is for

- merge/zip/grouping composition. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `zip`
- `merge`
- `combine`
- `zipLeft`
- `zipWith`
- `mergeAll`
- `zipRight`
- `mergeLeft`
- `zipLatest`
- `mergeRight`
- `zipFlatten`
- `mergeEffect`
- `mergeResult`
- `zipWithNext`
- `combineArray`
- `zipLatestAll`
- `zipWithArray`
- `zipWithIndex`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `combinators` concern for `effect/Stream`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect, Stream } from "effect"

const program = Effect.gen(function*() {
  yield* Stream.make(1, 2, 3).pipe(
    Stream.map((n) => n * 2),
    Stream.runForEach((n) => Console.log(n))
  )
})

Effect.runPromise(program)
// Output:
// 2
// 4
// 6
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-stream-concurrency` (effect/Stream#concurrency)
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
