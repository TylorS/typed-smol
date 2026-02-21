# Usage Reference: effect/unstable/ai/Prompt

- Import path: `effect/unstable/ai/Prompt`

## What It Is For

The `Prompt` module provides several data structures to simplify creating and combining prompts.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Prompt } from "effect/unstable/ai";

// Create a structured conversation
const conversation = Prompt.make([
  {
    role: "system",
    content: "You are a helpful assistant specialized in mathematics.",
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "What is the derivative of x²?",
      },
    ],
  },
  {
    role: "assistant",
    content: [
      {
        type: "text",
        text: "The derivative of x² is 2x.",
      },
    ],
  },
]);
```

## Test Anchors

- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/cli/Prompt.test.ts`
- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`

## Top Symbols In Anchored Tests

- `Prompt` (102)
- `make` (57)
- `makePart` (40)
- `makeMessage` (14)
- `empty` (12)
- `toolResultPart` (7)
- `concat` (5)
- `fromResponseParts` (5)
- `appendSystem` (4)
- `fromMessages` (4)
- `prependSystem` (4)
- `toolCallPart` (3)
- `assistantMessage` (2)
- `Message` (2)
- `ProviderOptions` (2)
