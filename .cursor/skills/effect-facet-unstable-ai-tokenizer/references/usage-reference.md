# Usage Reference: effect/unstable/ai/Tokenizer

- Import path: `effect/unstable/ai/Tokenizer`

## What It Is For

The `Tokenizer` module provides tokenization and text truncation capabilities for large language model text processing workflows.

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
import { Tokenizer } from "effect/unstable/ai"

const tokenizeText = Effect.gen(function*() {
  const tokenizer = yield* Tokenizer.Tokenizer
  const tokens = yield* tokenizer.tokenize("Hello, world!")
  console.log(`Token count: ${tokens.length}`)
  return tokens
})
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
