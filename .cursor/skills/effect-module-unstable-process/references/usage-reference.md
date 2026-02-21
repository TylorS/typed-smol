# Usage Reference: effect/unstable/process

- Import path: `effect/unstable/process`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { NodeServices } from "@effect/platform-node"
import { Effect, Stream } from "effect"
import { ChildProcess } from "effect/unstable/process"

// Build a command
const command = ChildProcess.make`echo "hello world"`

// Spawn and collect output
const program = Effect.gen(function*() {
  // You can `yield*` a command, which calls `ChildProcess.spawn`
  const handle = yield* command
  const chunks = yield* Stream.runCollect(handle.stdout)
  const exitCode = yield* handle.exitCode
  return { chunks, exitCode }
}).pipe(Effect.scoped, Effect.provide(NodeServices.layer))

// With options
const withOptions = ChildProcess.make({ cwd: "/tmp" })`ls -la`

// Piping commands
const pipeline = ChildProcess.make`cat package.json`.pipe(
  ChildProcess.pipeTo(ChildProcess.make`grep name`)
)

```

## Test Anchors

- `packages/effect/test/unstable/process/ChildProcess.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/Param.test.ts`

## Top Symbols In Anchored Tests

- `ChildProcess` (83)
- `ChildProcessSpawner` (17)
