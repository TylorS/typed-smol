# Usage Reference: effect/unstable/ai/Telemetry

- Import path: `effect/unstable/ai/Telemetry`

## What It Is For

The `Telemetry` module provides OpenTelemetry integration for operations performed against a large language model provider by defining telemetry attributes and utilities that follow the OpenTelemetry GenAI semantic conventions.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import { Telemetry } from "effect/unstable/ai";

// Add telemetry attributes to a span
const addTelemetry = Effect.gen(function* () {
  const span = yield* Effect.currentSpan;

  Telemetry.addGenAIAnnotations(span, {
    system: "openai",
    operation: { name: "chat" },
    request: {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000,
    },
    usage: {
      inputTokens: 100,
      outputTokens: 50,
    },
  });
});
```

## Test Anchors

- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
