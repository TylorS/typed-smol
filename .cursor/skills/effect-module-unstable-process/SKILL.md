---
name: effect-module-unstable-process
description: Guidance for `effect/unstable/process` focused on APIs like ChildProcess and ChildProcessSpawner. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/process

## Owned scope

- Owns only `effect/unstable/process`.
- Source of truth: `packages/effect/src/unstable/process/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `ChildProcess`
- `ChildProcessSpawner`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { NodeServices } from "@effect/platform-node";
import { Effect, Stream } from "effect";
import { ChildProcess } from "effect/unstable/process";

// Build a command
const command = ChildProcess.make`echo "hello world"`;

// Spawn and collect output
const program = Effect.gen(function* () {
  // You can `yield*` a command, which calls `ChildProcess.spawn`
  const handle = yield* command;
  const chunks = yield* Stream.runCollect(handle.stdout);
  const exitCode = yield* handle.exitCode;
  return { chunks, exitCode };
}).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

// With options
const withOptions = ChildProcess.make({ cwd: "/tmp" })`ls -la`;

// Piping commands
const pipeline = ChildProcess.make`cat package.json`.pipe(
  ChildProcess.pipeTo(ChildProcess.make`grep name`),
);
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-process-childprocess` (effect/unstable/process/ChildProcess)
  - `effect-facet-unstable-process-childprocessspawner` (effect/unstable/process/ChildProcessSpawner)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-process-childprocess`.

## Reference anchors

- Module source: `packages/effect/src/unstable/process/index.ts`
- Representative tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Param.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
