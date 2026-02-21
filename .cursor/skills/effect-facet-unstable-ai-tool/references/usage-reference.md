# Usage Reference: effect/unstable/ai/Tool

- Import path: `effect/unstable/ai/Tool`

## What It Is For

The `Tool` module provides functionality for defining and managing tools that language models can call to augment their capabilities.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema } from "effect"
import { Tool } from "effect/unstable/ai"

// Define a simple calculator tool
const Calculator = Tool.make("Calculator", {
  description: "Performs basic arithmetic operations",
  parameters: Schema.Struct({
    operation: Schema.Literals(["add", "subtract", "multiply", "divide"]),
    a: Schema.Number,
    b: Schema.Number
  }),
  success: Schema.Number
})
```

## Test Anchors

- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `make` (57)
- `Tool` (52)
- `dynamic` (16)
- `isDynamic` (9)
- `getJsonSchema` (4)
- `getStrictMode` (4)
- `Strict` (4)
- `providerDefined` (3)
- `Failure` (2)
- `Dynamic` (1)
