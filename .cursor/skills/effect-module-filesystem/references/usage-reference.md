# Usage Reference: effect/FileSystem

- Import path: `effect/FileSystem`

## What It Is For

This module provides a comprehensive file system abstraction that supports both synchronous and asynchronous file operations through Effect. It includes utilities for file I/O, directory management, permissions, timestamps, and file watching with proper error handling.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/ConfigProvider.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`
- `packages/effect/test/unstable/cli/LogLevel.test.ts`

## Top Symbols In Anchored Tests

- `make` (58)
- `FileSystem` (16)
- `Create` (11)
- `layerNoop` (8)
- `Info` (7)
- `Remove` (3)
- `File` (1)
