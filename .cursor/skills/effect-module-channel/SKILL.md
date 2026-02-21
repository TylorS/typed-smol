---
name: effect-module-channel
description: Guidance for `effect/Channel` focused on APIs like map, fail, and empty. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Channel

## Owned scope

- Owns only `effect/Channel`.
- Source of truth: `packages/effect/src/Channel.ts`.

## What it is for

- The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## API quick reference

- `map`
- `fail`
- `empty`
- `filter`
- `flatMap`
- `mapDone`
- `provide`
- `runDone`
- `runFold`
- `runHead`
- `runLast`
- `succeed`
- `failSync`
- `fromPull`
- `mapAccum`
- `mapError`
- `mapInput`
- `runCount`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
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

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-channel-composition` (effect/Channel#composition)
  - `effect-facet-channel-core` (effect/Channel#core)
  - `effect-facet-channel-utilities` (effect/Channel#utilities)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-channel-composition`.

## Reference anchors

- Module source: `packages/effect/src/Channel.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
