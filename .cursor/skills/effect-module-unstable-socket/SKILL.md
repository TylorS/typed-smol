---
name: effect-module-unstable-socket
description: Guidance for `effect/unstable/socket` focused on APIs like Socket and SocketServer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/socket

## Owned scope

- Owns only `effect/unstable/socket`.
- Source of truth: `packages/effect/src/unstable/socket/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Socket`
- `SocketServer`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { socket } from "effect/unstable/socket"

const value = socket.Socket()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-socket-socket` (effect/unstable/socket/Socket)
  - `effect-facet-unstable-socket-socketserver` (effect/unstable/socket/SocketServer)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-socket-socket`.

## Reference anchors

- Module source: `packages/effect/src/unstable/socket/index.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
