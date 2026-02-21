---
name: effect-facet-unstable-process-childprocess
description: Guidance for facet `effect/unstable/process/ChildProcess` focused on APIs like make, setCwd, and setEnv. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/process/ChildProcess

## Owned scope

- Owns only `effect/unstable/process/ChildProcess`.
- Parent module: `effect/unstable/process`.
- Source anchor: `packages/effect/src/unstable/process/ChildProcess.ts`.

## What it is for

- An Effect-native module for working with child processes.

## API quick reference

- `make`
- `setCwd`
- `setEnv`
- `parseFdName`
- `isCommand`
- `isPipedCommand`
- `isStandardCommand`
- `lines`
- `spawn`
- `fdName`
- `pipeTo`
- `prefix`
- `Signal`
- `string`
- `Command`
- `Encoding`
- `exitCode`
- `KillOptions`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

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

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-process-childprocessspawner` (effect/unstable/process/ChildProcessSpawner)
- Parent module ownership belongs to `effect-module-unstable-process`.

## Escalate to

- `effect-module-unstable-process` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/process/ChildProcess.ts`
- Parent tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Param.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
