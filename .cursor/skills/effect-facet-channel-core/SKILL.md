---
name: effect-facet-channel-core
description: Guidance for facet `effect/Channel#core` focused on APIs like runDone, runFold, and runHead. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Channel#core

## Owned scope

- Owns only `effect/Channel#core`.
- Parent module: `effect/Channel`.

## What it is for

- core channel model and constructors. The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## API quick reference

- `runDone`
- `runFold`
- `runHead`
- `runLast`
- `fromPull`
- `runCount`
- `runDrain`
- `fromArray`
- `fromChunk`
- `fromQueue`
- `fromEffect`
- `fromPubSub`
- `runCollect`
- `runForEach`
- `fromIterable`
- `fromIterator`
- `fromSchedule`
- `runIntoQueue`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `core` concern for `effect/Channel`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Channel } from "effect"

// Simple channel that outputs numbers
const numberChannel = Channel.succeed(42)

// Transform channel that doubles values
const doubleChannel = Channel.map(numberChannel, (n) => n * 2)

// Running the channel would output: 84
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-channel-composition` (effect/Channel#composition)
  - `effect-facet-channel-utilities` (effect/Channel#utilities)
- Parent module ownership belongs to `effect-module-channel`.

## Escalate to

- `effect-module-channel` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Channel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
