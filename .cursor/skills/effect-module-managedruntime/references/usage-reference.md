# Usage Reference: effect/ManagedRuntime

- Import path: `effect/ManagedRuntime`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Console, Effect, Layer, ManagedRuntime, ServiceMap } from "effect";

class Notifications extends ServiceMap.Service<
  Notifications,
  {
    readonly notify: (message: string) => Effect.Effect<void>;
  }
>()("Notifications") {
  static layer = Layer.succeed(this)({
    notify: (message) => Console.log(message),
  });
}

async function main() {
  const runtime = ManagedRuntime.make(Notifications.layer);
  await runtime.runPromise(
    Effect.flatMap(Notifications.asEffect(), (_) => _.notify("Hello, world!")),
  );
  await runtime.dispose();
}

main();
```

## Test Anchors

- `packages/effect/test/ManagedRuntime.test.ts`

## Top Symbols In Anchored Tests

- `ManagedRuntime` (7)
- `make` (5)
