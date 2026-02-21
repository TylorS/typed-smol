# Usage Reference: effect/unstable/ai/OpenAiStructuredOutput

- Import path: `effect/unstable/ai/OpenAiStructuredOutput`

## What It Is For

Provides codec transformations for OpenAI structured output.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { OpenAiStructuredOutput } from "effect/unstable/ai/OpenAiStructuredOutput"

const value = OpenAiStructuredOutput.toCodecOpenAI()
```

## Test Anchors

- `packages/effect/test/unstable/ai/OpenAiStructuredOutput.test.ts`
- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`

## Top Symbols In Anchored Tests

- `toCodecOpenAI` (9)
