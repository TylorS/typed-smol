---
name: effect-module-txqueue
description: Guidance for `effect/TxQueue` focused on APIs like fail, offer, and offerAll. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxQueue

## Owned scope

- Owns only `effect/TxQueue`.
- Source of truth: `packages/effect/src/TxQueue.ts`.

## What it is for

- TxQueue is a transactional queue data structure that provides Software Transactional Memory (STM) semantics for queue operations. It uses TxRef for transactional state management and supports multiple queue strategies: bounded, unbounded, dropping, and sliding.

## API quick reference

- `fail`
- `offer`
- `offerAll`
- `failCause`
- `isDone`
- `isFull`
- `isOpen`
- `isEmpty`
- `isClosing`
- `isTxQueue`
- `isShutdown`
- `isTxDequeue`
- `isTxEnqueue`
- `end`
- `peek`
- `poll`
- `size`
- `take`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { TxQueue } from "effect";

// State progression example
declare const state: TxQueue.State<string, Error>;

if (state._tag === "Open") {
  console.log("Queue is accepting new items");
} else if (state._tag === "Closing") {
  console.log("Queue is draining, cause:", state.cause);
} else {
  console.log("Queue is done, cause:", state.cause);
}
```

## Common pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/TxQueue.ts`
- Representative tests: `packages/effect/test/TxQueue.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
