# Usage Reference: effect/unstable/ai/Model

- Import path: `effect/unstable/ai/Model`

## What It Is For

The `Model` module provides a unified interface for AI service providers.

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
import type { Layer } from "effect";
import { Effect } from "effect";
import { LanguageModel, Model } from "effect/unstable/ai";

declare const myAnthropicLayer: Layer.Layer<LanguageModel.LanguageModel>;

const anthropicModel = Model.make("anthropic", myAnthropicLayer);

const program = Effect.gen(function* () {
  const response = yield* LanguageModel.generateText({
    prompt: "Hello, world!",
  });
  return response.text;
}).pipe(Effect.provide(anthropicModel));
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
