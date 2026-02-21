# Usage Reference: effect/unstable/ai/Response

- Import path: `effect/unstable/ai/Response`

## What It Is For

The `Response` module provides data structures to represent responses from large language models.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Response } from "effect/unstable/ai"

// Create a simple text response part
const textResponse = Response.makePart("text", {
  text: "The weather is sunny today!"
})

// Create a tool call response part
const toolCallResponse = Response.makePart("tool-call", {
  id: "call_123",
  name: "get_weather",
  params: { city: "San Francisco" },
  providerExecuted: false
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

- `makePart` (40)
- `toolResultPart` (7)
- `StreamPart` (5)
- `ProviderMetadata` (3)
- `toolCallPart` (3)
- `ToolResultPart` (2)
- `ToolResultParts` (1)
