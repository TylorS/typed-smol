# Usage Reference: effect/Scheduler

- Import path: `effect/Scheduler`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Scheduler.test.ts`

## Top Symbols In Anchored Tests

- `MixedScheduler` (5)
- `Scheduler` (2)
