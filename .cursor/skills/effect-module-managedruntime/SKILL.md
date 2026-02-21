---
name: effect-module-managedruntime
description: Guidance for `effect/ManagedRuntime` focused on APIs like make, Services, and isManagedRuntime. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ManagedRuntime

## Owned scope

- Owns only `effect/ManagedRuntime`.
- Source of truth: `packages/effect/src/ManagedRuntime.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `Services`
- `isManagedRuntime`
- `Error`
- `ManagedRuntime`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect, Layer, ManagedRuntime, ServiceMap } from "effect"

class Notifications extends ServiceMap.Service<Notifications, {
  readonly notify: (message: string) => Effect.Effect<void>
}>()("Notifications") {
  static layer = Layer.succeed(this)({
    notify: (message) => Console.log(message)
  })
}

async function main() {
  const runtime = ManagedRuntime.make(Notifications.layer)
  await runtime.runPromise(Effect.flatMap(
    Notifications.asEffect(),
    (_) => _.notify("Hello, world!")
  ))
  await runtime.dispose()
}

main()
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ManagedRuntime.ts`
- Representative tests: `packages/effect/test/ManagedRuntime.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
