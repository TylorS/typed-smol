---
name: effect-module-scheduler
description: Guidance for `effect/Scheduler` focused on APIs like Scheduler, MaxOpsBeforeYield, and MixedScheduler. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Scheduler

## Owned scope

- Owns only `effect/Scheduler`.
- Source of truth: `packages/effect/src/Scheduler.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Scheduler`
- `MaxOpsBeforeYield`
- `MixedScheduler`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { MixedScheduler } from "effect/Scheduler"

// Create a mixed scheduler with async execution (default)
const asyncScheduler = new MixedScheduler("async")

// Create a mixed scheduler with sync execution
const syncScheduler = new MixedScheduler("sync")

// Schedule tasks with different priorities
asyncScheduler.scheduleTask(() => console.log("High priority task"), 10)
asyncScheduler.scheduleTask(() => console.log("Normal priority task"), 0)
asyncScheduler.scheduleTask(() => console.log("Low priority task"), -1)

// For sync scheduler, you can flush tasks immediately
syncScheduler.scheduleTask(() => console.log("Task 1"), 0)
syncScheduler.scheduleTask(() => console.log("Task 2"), 0)

// Force flush all pending tasks in sync mode
syncScheduler.flush()
// Output: "Task 1", "Task 2"

// Check execution mode
console.log(asyncScheduler.executionMode) // "async"
console.log(syncScheduler.executionMode) // "sync"
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Scheduler.ts`
- Representative tests: `packages/effect/test/Scheduler.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
