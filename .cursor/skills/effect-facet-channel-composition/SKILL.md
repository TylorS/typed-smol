---
name: effect-facet-channel-composition
description: Guidance for facet `effect/Channel#composition` focused on APIs like map, flatMap, and mapDone. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Channel#composition

## Owned scope

- Owns only `effect/Channel#composition`.
- Parent module: `effect/Channel`.

## What it is for

- sequencing/transformation pipelines. The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## API quick reference

- `map`
- `flatMap`
- `mapDone`
- `provide`
- `mapAccum`
- `mapError`
- `mapInput`
- `mapEffect`
- `mapDoneEffect`
- `mapInputError`
- `provideService`
- `provideServiceEffect`
- `provideServices`
- `bind`
- `merge`
- `bindTo`
- `concat`
- `pipeTo`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `composition` concern for `effect/Channel`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

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
  - `effect-facet-channel-core` (effect/Channel#core)
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
