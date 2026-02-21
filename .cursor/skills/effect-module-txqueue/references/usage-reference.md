# Usage Reference: effect/TxQueue

- Import path: `effect/TxQueue`

## What It Is For

TxQueue is a transactional queue data structure that provides Software Transactional Memory (STM) semantics for queue operations. It uses TxRef for transactional state management and supports multiple queue strategies: bounded, unbounded, dropping, and sliding.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Starter Example

```ts
import type { TxQueue } from "effect"

// State progression example
declare const state: TxQueue.State<string, Error>

if (state._tag === "Open") {
  console.log("Queue is accepting new items")
} else if (state._tag === "Closing") {
  console.log("Queue is draining, cause:", state.cause)
} else {
  console.log("Queue is done, cause:", state.cause)
}
```

## Test Anchors

- `packages/effect/test/TxQueue.test.ts`

## Top Symbols In Anchored Tests

- `TxQueue` (379)
- `bounded` (84)
- `size` (62)
- `take` (45)
- `isDone` (39)
- `offerAll` (34)
- `interrupt` (33)
- `offer` (30)
- `fail` (27)
- `isEmpty` (26)
- `awaitCompletion` (24)
- `takeAll` (22)
- `isClosing` (20)
- `takeN` (18)
- `isOpen` (17)
