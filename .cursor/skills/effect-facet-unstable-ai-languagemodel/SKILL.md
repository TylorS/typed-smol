---
name: effect-facet-unstable-ai-languagemodel
description: Guidance for facet `effect/unstable/ai/LanguageModel` focused on APIs like make, Service, and generateText. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/LanguageModel

## Owned scope

- Owns only `effect/unstable/ai/LanguageModel`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/LanguageModel.ts`.

## What it is for

- The `LanguageModel` module provides AI text generation capabilities with tool calling support.

## API quick reference

- `make`
- `Service`
- `generateText`
- `getObjectName`
- `generateObject`
- `GenerateObjectOptions`
- `GenerateObjectResponse`
- `GenerateTextOptions`
- `GenerateTextResponse`
- `ProviderOptions`
- `streamText`
- `ToolChoice`
- `ExtractError`
- `LanguageModel`
- `CodecTransformer`
- `ConstructorParams`
- `CurrentCodecTransformer`
- `defaultCodecTransformer`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Effect } from "effect"
import { LanguageModel } from "effect/unstable/ai"

// Basic text generation
const program = Effect.gen(function*() {
  const response = yield* LanguageModel.generateText({
    prompt: "Explain quantum computing"
  })

  console.log(response.text)

  return response
})
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
  - `effect-facet-unstable-ai-mcpschema` (effect/unstable/ai/McpSchema)
  - `effect-facet-unstable-ai-mcpserver` (effect/unstable/ai/McpServer)
  - `effect-facet-unstable-ai-model` (effect/unstable/ai/Model)
  - `effect-facet-unstable-ai-openaistructuredoutput` (effect/unstable/ai/OpenAiStructuredOutput)
  - `effect-facet-unstable-ai-prompt` (effect/unstable/ai/Prompt)
  - `effect-facet-unstable-ai-response` (effect/unstable/ai/Response)
  - `effect-facet-unstable-ai-telemetry` (effect/unstable/ai/Telemetry)
  - `effect-facet-unstable-ai-tokenizer` (effect/unstable/ai/Tokenizer)
  - `effect-facet-unstable-ai-tool` (effect/unstable/ai/Tool)
  - `effect-facet-unstable-ai-toolkit` (effect/unstable/ai/Toolkit)
- Parent module ownership belongs to `effect-module-unstable-ai`.

## Escalate to

- `effect-module-unstable-ai` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/ai/LanguageModel.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
