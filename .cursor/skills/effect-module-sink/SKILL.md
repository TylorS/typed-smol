---
name: effect-module-sink
description: Guidance for `effect/Sink` focused on APIs like map, fail, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Sink

## Owned scope

- Owns only `effect/Sink`.
- Source of truth: `packages/effect/src/Sink.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `fail`
- `make`
- `mapEnd`
- `flatMap`
- `succeed`
- `failSync`
- `mapError`
- `mapInput`
- `failCause`
- `fromQueue`
- `mapEffect`
- `fromEffect`
- `fromPubSub`
- `fromChannel`
- `mapLeftover`
- `mapEffectEnd`
- `failCauseSync`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

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

- Deep module subsets are owned by these facet skills:
  - `effect-facet-sink-core` (effect/Sink#core)
  - `effect-facet-sink-reducing` (effect/Sink#reducing)
  - `effect-facet-sink-transforms` (effect/Sink#transforms)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-sink-core`.

## Reference anchors

- Module source: `packages/effect/src/Sink.ts`
- Representative tests: `packages/effect/test/Sink.test.ts`
- Representative tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
