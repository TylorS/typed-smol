---
name: effect-facet-unstable-ai-model
description: Guidance for facet `effect/unstable/ai/Model` focused on APIs like make, ProviderName, and Model. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/Model

## Owned scope

- Owns only `effect/unstable/ai/Model`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/Model.ts`.

## What it is for

- The `Model` module provides a unified interface for AI service providers.

## API quick reference

- `make`
- `ProviderName`
- `Model`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Layer } from "effect"
import { Effect } from "effect"
import { LanguageModel, Model } from "effect/unstable/ai"

declare const myAnthropicLayer: Layer.Layer<LanguageModel.LanguageModel>

const anthropicModel = Model.make("anthropic", myAnthropicLayer)

const program = Effect.gen(function*() {
  const response = yield* LanguageModel.generateText({
    prompt: "Hello, world!"
  })
  return response.text
}).pipe(
  Effect.provide(anthropicModel)
)
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

- Facet source: `packages/effect/src/unstable/ai/Model.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
