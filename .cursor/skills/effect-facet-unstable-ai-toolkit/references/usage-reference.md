# Usage Reference: effect/unstable/ai/Toolkit

- Import path: `effect/unstable/ai/Toolkit`

## What It Is For

The `Toolkit` module allows for creating and implementing a collection of `Tool`s which can be used to enhance the capabilities of a large language model beyond simple text generation.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Schema } from "effect"
import { Tool, Toolkit } from "effect/unstable/ai"

// Create individual tools
const GetCurrentTime = Tool.make("GetCurrentTime", {
  description: "Get the current timestamp",
  success: Schema.Number
})

const GetWeather = Tool.make("GetWeather", {
  description: "Get weather for a location",
  parameters: Schema.Struct({ location: Schema.String }),
  success: Schema.Struct({
    temperature: Schema.Number,
    condition: Schema.String
  })
})

// Create a toolkit with multiple tools
const MyToolkit = Toolkit.make(GetCurrentTime, GetWeather)

const MyToolkitLayer = MyToolkit.toLayer({
  GetCurrentTime: () => Effect.succeed(Date.now()),
  GetWeather: ({ location }) =>
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
- `Toolkit` (36)
- `empty` (10)
- `Tools` (6)
- `merge` (1)
