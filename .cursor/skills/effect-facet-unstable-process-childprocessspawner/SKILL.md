---
name: effect-facet-unstable-process-childprocessspawner
description: Guidance for facet `effect/unstable/process/ChildProcessSpawner` focused on APIs like makeHandle, ExitCode, and ProcessId. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/process/ChildProcessSpawner

## Owned scope

- Owns only `effect/unstable/process/ChildProcessSpawner`.
- Parent module: `effect/unstable/process`.
- Source anchor: `packages/effect/src/unstable/process/ChildProcessSpawner.ts`.

## What it is for

- A module providing a generic service interface for spawning child processes.

## API quick reference

- `makeHandle`
- `ExitCode`
- `ProcessId`
- `ChildProcessHandle`
- `ChildProcessSpawner`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner"

const value = ChildProcessSpawner.makeHandle()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-process-childprocess` (effect/unstable/process/ChildProcess)
- Parent module ownership belongs to `effect-module-unstable-process`.

## Escalate to

- `effect-module-unstable-process` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/process/ChildProcessSpawner.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Help.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/LogLevel.test.ts`
- Parent tests: `packages/effect/test/unstable/process/ChildProcess.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
