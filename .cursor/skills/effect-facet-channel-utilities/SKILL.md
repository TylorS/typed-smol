---
name: effect-facet-channel-utilities
description: Guidance for facet `effect/Channel#utilities` focused on APIs like provide, mapError, and mapInputError. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Channel#utilities

## Owned scope

- Owns only `effect/Channel#utilities`.
- Parent module: `effect/Channel`.

## What it is for

- supportive helper operations. The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## API quick reference

- `provide`
- `mapError`
- `mapInputError`
- `provideService`
- `provideServiceEffect`
- `provideServices`
- `onError`
- `identity`
- `tapError`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `utilities` concern for `effect/Channel`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Channel } from "effect";

// Simple channel that outputs numbers
const numberChannel = Channel.succeed(42);

// Transform channel that doubles values
const doubleChannel = Channel.map(numberChannel, (n) => n * 2);

// Running the channel would output: 84
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-channel-composition` (effect/Channel#composition)
  - `effect-facet-channel-core` (effect/Channel#core)
- Parent module ownership belongs to `effect-module-channel`.

## Escalate to

- `effect-module-channel` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Channel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
