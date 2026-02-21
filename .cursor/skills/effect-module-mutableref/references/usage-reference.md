# Usage Reference: effect/MutableRef

- Import path: `effect/MutableRef`

## What It Is For

MutableRef provides a mutable reference container that allows safe mutation of values in functional programming contexts. It serves as a bridge between functional and imperative programming paradigms, offering atomic operations for state management.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { MutableRef } from "effect";

// Create a mutable reference
const ref: MutableRef.MutableRef<number> = MutableRef.make(42);

// Read the current value
console.log(ref.current); // 42
console.log(MutableRef.get(ref)); // 42

// Update the value
ref.current = 100;
console.log(MutableRef.get(ref)); // 100

// Use with complex types
interface Config {
  timeout: number;
  retries: number;
}

const config: MutableRef.MutableRef<Config> = MutableRef.make({
  timeout: 5000,
  retries: 3,
});
```

## Test Anchors

- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `make` (4)
- `get` (3)
- `MutableRef` (2)
- `set` (1)
