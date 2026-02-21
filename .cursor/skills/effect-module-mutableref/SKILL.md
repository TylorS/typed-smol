---
name: effect-module-mutableref
description: Guidance for `effect/MutableRef` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module MutableRef

## Owned scope

- Owns only `effect/MutableRef`.
- Source of truth: `packages/effect/src/MutableRef.ts`.

## What it is for

- MutableRef provides a mutable reference container that allows safe mutation of values in functional programming contexts. It serves as a bridge between functional and imperative programming paradigms, offering atomic operations for state management.

## API quick reference

- `get`
- `set`
- `make`
- `update`
- `getAndSet`
- `setAndGet`
- `getAndUpdate`
- `updateAndGet`
- `getAndDecrement`
- `getAndIncrement`
- `toggle`
- `decrement`
- `increment`
- `MutableRef`
- `compareAndSet`
- `decrementAndGet`
- `incrementAndGet`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { MutableRef } from "effect"

// Create a mutable reference
const ref: MutableRef.MutableRef<number> = MutableRef.make(42)

// Read the current value
console.log(ref.current) // 42
console.log(MutableRef.get(ref)) // 42

// Update the value
ref.current = 100
console.log(MutableRef.get(ref)) // 100

// Use with complex types
interface Config {
  timeout: number
  retries: number
}

const config: MutableRef.MutableRef<Config> = MutableRef.make({
  timeout: 5000,
  retries: 3
})

```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/MutableRef.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
