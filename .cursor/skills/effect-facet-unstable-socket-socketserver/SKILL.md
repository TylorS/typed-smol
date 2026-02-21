---
name: effect-facet-unstable-socket-socketserver
description: Guidance for facet `effect/unstable/socket/SocketServer` focused on APIs like Address, TcpAddress, and ErrorTypeId. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/socket/SocketServer

## Owned scope

- Owns only `effect/unstable/socket/SocketServer`.
- Parent module: `effect/unstable/socket`.
- Source anchor: `packages/effect/src/unstable/socket/SocketServer.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Address`
- `TcpAddress`
- `ErrorTypeId`
- `UnixAddress`
- `SocketServer`
- `SocketServerError`
- `SocketServerErrorReason`
- `SocketServerOpenError`
- `SocketServerUnknownError`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { SocketServer } from "effect/unstable/socket/SocketServer"

const value = SocketServer.Address()
const next = SocketServer.SocketServerUnknownError(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-socket-socket` (effect/unstable/socket/Socket)
- Parent module ownership belongs to `effect-module-unstable-socket`.

## Escalate to

- `effect-module-unstable-socket` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/socket/SocketServer.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
