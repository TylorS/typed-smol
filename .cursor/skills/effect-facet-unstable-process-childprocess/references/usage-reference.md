# Usage Reference: effect/unstable/process/ChildProcess

- Import path: `effect/unstable/process/ChildProcess`

## What It Is For

An Effect-native module for working with child processes.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

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

- `make` (60)
- `Command` (51)
- `string` (43)
- `StandardCommand` (15)
- `parseFdName` (14)
- `spawn` (11)
- `pipeTo` (9)
- `isStandardCommand` (7)
- `PipedCommand` (6)
- `prefix` (5)
- `exitCode` (4)
- `fdName` (4)
- `isCommand` (4)
- `isPipedCommand` (3)
- `setCwd` (3)
