---
name: effect-module-filesystem
description: Guidance for `effect/FileSystem` focused on APIs like make, Update, and makeNoop. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module FileSystem

## Owned scope

- Owns only `effect/FileSystem`.
- Source of truth: `packages/effect/src/FileSystem.ts`.

## What it is for

- This module provides a comprehensive file system abstraction that supports both synchronous and asynchronous file operations through Effect. It includes utilities for file I/O, directory management, permissions, timestamps, and file watching with proper error handling.

## API quick reference

- `make`
- `Update`
- `makeNoop`
- `layerNoop`
- `isFile`
- `GiB`
- `KiB`
- `MiB`
- `PiB`
- `TiB`
- `File`
- `Info`
- `Size`
- `Type`
- `Create`
- `Remove`
- `OpenFlag`
- `SeekMode`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect, FileSystem } from "effect"

const program = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem

  // Create a directory
  yield* fs.makeDirectory("./temp", { recursive: true })

  // Write a file
  yield* fs.writeFileString("./temp/hello.txt", "Hello, World!")

  // Read the file back
  const content = yield* fs.readFileString("./temp/hello.txt")
  yield* Console.log("File content:", content)

  // Get file information
  const stats = yield* fs.stat("./temp/hello.txt")
  yield* Console.log("File size:", stats.size)

  // Clean up
  yield* fs.remove("./temp", { recursive: true })
})
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/FileSystem.ts`
- Representative tests: `packages/effect/test/ConfigProvider.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Help.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/LogLevel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
