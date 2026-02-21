---
name: effect-facet-sink-transforms
description: Guidance for facet `effect/Sink#transforms` focused on APIs like map, mapEnd, and flatMap. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Sink#transforms

## Owned scope

- Owns only `effect/Sink#transforms`.
- Parent module: `effect/Sink`.

## What it is for

- mapping and composition helpers. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `mapEnd`
- `flatMap`
- `mapError`
- `mapInput`
- `mapEffect`
- `mapLeftover`
- `mapEffectEnd`
- `fromTransform`
- `mapInputArray`
- `mapInputArrayEffect`
- `mapInputEffect`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `transforms` concern for `effect/Sink`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.

## Starter example

```ts
import { Effect } from "effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

// Create a simple sink that always succeeds with a value
const sink: Sink.Sink<number> = Sink.succeed(42);

// Use the sink to consume a stream
const stream = Stream.make(1, 2, 3);
const program = Stream.run(stream, sink);

Effect.runPromise(program).then(console.log);
// Output: 42
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-sink-core` (effect/Sink#core)
  - `effect-facet-sink-reducing` (effect/Sink#reducing)
- Parent module ownership belongs to `effect-module-sink`.

## Escalate to

- `effect-module-sink` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Sink.test.ts`
- Parent tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
