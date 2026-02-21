# Usage Reference: effect/Exit

- Import path: `effect/Exit`

## What It Is For

Represents the outcome of an Effect computation as a plain, synchronously inspectable value.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Exit } from "effect"

const success = Exit.succeed(42)
const failure = Exit.fail("not found")

const message = Exit.match(success, {
  onSuccess: (value) => `Got: ${value}`,
  onFailure: () => "Failed"
})
console.log(message) // "Got: 42"
```

## Test Anchors

- `packages/effect/test/Exit.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/RcRef.test.ts`
- `packages/effect/test/Request.test.ts`

## Top Symbols In Anchored Tests

- `fail` (41)
- `Exit` (39)
- `succeed` (36)
- `interrupt` (13)
- `map` (9)
- `Failure` (8)
- `failCause` (2)
- `die` (1)
- `hasInterrupts` (1)
- `Success` (1)
