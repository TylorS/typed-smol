# Usage Reference: effect/Cause

- Import path: `effect/Cause`

## What It Is For

Structured representation of how an Effect can fail.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Cause, Effect } from "effect";

const program = Effect.gen(function* () {
  const cause = yield* Effect.sandbox(
    Effect.all([Effect.fail("err1"), Effect.die("defect"), Effect.fail("err2")], {
      concurrency: "unbounded",
    }),
  ).pipe(Effect.flip);

  const errors = cause.reasons.filter(Cause.isFailReason).map((r) => r.error);

  const defects = cause.reasons.filter(Cause.isDieReason).map((r) => r.defect);

  console.log(errors); // ["err1", "err2"]  (order may vary)
  console.log(defects); // ["defect"]
});

Effect.runPromise(program);
```

## Test Anchors

- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Request.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `annotate` (79)
- `fail` (39)
- `Cause` (31)
- `interrupt` (10)
- `empty` (8)
- `done` (7)
- `map` (7)
- `annotations` (4)
- `Error` (4)
- `isDone` (4)
- `die` (2)
- `Done` (2)
- `hasInterruptsOnly` (2)
- `hasInterrupts` (1)
- `isNoSuchElementError` (1)
