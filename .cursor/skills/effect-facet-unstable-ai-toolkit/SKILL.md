---
name: effect-facet-unstable-ai-toolkit
description: Guidance for facet `effect/unstable/ai/Toolkit` focused on APIs like make, empty, and Any. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/Toolkit

## Owned scope

- Owns only `effect/unstable/ai/Toolkit`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/Toolkit.ts`.

## What it is for

- The `Toolkit` module allows for creating and implementing a collection of `Tool`s which can be used to enhance the capabilities of a large language model beyond simple text generation.

## API quick reference

- `make`
- `empty`
- `Any`
- `merge`
- `Tools`
- `Toolkit`
- `MergedTools`
- `ToolsByName`
- `WithHandler`
- `HandlersFrom`
- `MergeRecords`
- `HandlerContext`
- `SimplifyRecord`
- `WithHandlerTools`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

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

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-ai-aierror` (effect/unstable/ai/AiError)
  - `effect-facet-unstable-ai-anthropicstructuredoutput` (effect/unstable/ai/AnthropicStructuredOutput)
  - `effect-facet-unstable-ai-chat` (effect/unstable/ai/Chat)
  - `effect-facet-unstable-ai-idgenerator` (effect/unstable/ai/IdGenerator)
  - `effect-facet-unstable-ai-languagemodel` (effect/unstable/ai/LanguageModel)
  - `effect-facet-unstable-ai-mcpschema` (effect/unstable/ai/McpSchema)
  - `effect-facet-unstable-ai-mcpserver` (effect/unstable/ai/McpServer)
  - `effect-facet-unstable-ai-model` (effect/unstable/ai/Model)
  - `effect-facet-unstable-ai-openaistructuredoutput` (effect/unstable/ai/OpenAiStructuredOutput)
  - `effect-facet-unstable-ai-prompt` (effect/unstable/ai/Prompt)
  - `effect-facet-unstable-ai-response` (effect/unstable/ai/Response)
  - `effect-facet-unstable-ai-telemetry` (effect/unstable/ai/Telemetry)
  - `effect-facet-unstable-ai-tokenizer` (effect/unstable/ai/Tokenizer)
  - `effect-facet-unstable-ai-tool` (effect/unstable/ai/Tool)
- Parent module ownership belongs to `effect-module-unstable-ai`.

## Escalate to

- `effect-module-unstable-ai` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/ai/Toolkit.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
