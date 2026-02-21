# Usage Reference: effect/unstable/ai/IdGenerator

- Import path: `effect/unstable/ai/IdGenerator`

## What It Is For

The `IdGenerator` module provides a pluggable system for generating unique identifiers for tool calls and other items in the Effect AI SDKs.

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
import { Effect } from "effect"
import { IdGenerator } from "effect/unstable/ai"

// Using the default ID generator
const program = Effect.gen(function*() {
  const idGen = yield* IdGenerator.IdGenerator
  const toolCallId = yield* idGen.generateId()
  console.log(toolCallId) // "id_A7xK9mP2qR5tY8uV"
  return toolCallId
}).pipe(Effect.provideService(
  IdGenerator.IdGenerator,
  IdGenerator.defaultIdGenerator
))
```

## Test Anchors

- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `make` (57)
- `layer` (6)
- `IdGenerator` (3)
