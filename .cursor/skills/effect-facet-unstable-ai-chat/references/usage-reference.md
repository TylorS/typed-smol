# Usage Reference: effect/unstable/ai/Chat

- Import path: `effect/unstable/ai/Chat`

## What It Is For

The `Chat` module provides a stateful conversation interface for AI language models.

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
import { Effect } from "effect";
import { Chat } from "effect/unstable/ai";

// Create a new chat session
const program = Effect.gen(function* () {
  const chat = yield* Chat.empty;

  // Send a message and get response
  const response = yield* chat.generateText({
    prompt: "Hello! What can you help me with?",
  });

  console.log(response.content);

  return response;
});
```

## Test Anchors

- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `Persistence` (12)
- `Chat` (11)
- `empty` (10)
- `ChatNotFoundError` (1)
- `layerPersisted` (1)
