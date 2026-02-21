# Usage Reference: effect/unstable/ai/LanguageModel

- Import path: `effect/unstable/ai/LanguageModel`

## What It Is For

The `LanguageModel` module provides AI text generation capabilities with tool calling support.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import { LanguageModel } from "effect/unstable/ai";

// Basic text generation
const program = Effect.gen(function* () {
  const response = yield* LanguageModel.generateText({
    prompt: "Explain quantum computing",
  });

  console.log(response.text);

  return response;
});
```

## Test Anchors

- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `make` (57)
- `generateText` (39)
- `LanguageModel` (33)
- `streamText` (26)
- `ProviderOptions` (2)
