# Usage Reference: effect/unstable/process/ChildProcessSpawner

- Import path: `effect/unstable/process/ChildProcessSpawner`

## What It Is For

A module providing a generic service interface for spawning child processes.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner";

const value = ChildProcessSpawner.makeHandle();
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`
- `packages/effect/test/unstable/cli/LogLevel.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`

## Top Symbols In Anchored Tests

- `ChildProcessSpawner` (26)
- `ProcessId` (5)
- `ExitCode` (2)
- `ChildProcessHandle` (1)
- `makeHandle` (1)
