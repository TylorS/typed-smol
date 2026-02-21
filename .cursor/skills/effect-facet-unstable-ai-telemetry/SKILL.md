---
name: effect-facet-unstable-ai-telemetry
description: Guidance for facet `effect/unstable/ai/Telemetry` focused on APIs like GenAITelemetryAttributeOptions, GenAITelemetryAttributes, and AllAttributes. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/Telemetry

## Owned scope

- Owns only `effect/unstable/ai/Telemetry`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/Telemetry.ts`.

## What it is for

- The `Telemetry` module provides OpenTelemetry integration for operations performed against a large language model provider by defining telemetry attributes and utilities that follow the OpenTelemetry GenAI semantic conventions.

## API quick reference

- `GenAITelemetryAttributeOptions`
- `GenAITelemetryAttributes`
- `AllAttributes`
- `addGenAIAnnotations`
- `addSpanAttributes`
- `AttributesWithPrefix`
- `BaseAttributes`
- `CurrentSpanTransformer`
- `FormatAttributeName`
- `OperationAttributes`
- `RequestAttributes`
- `ResponseAttributes`
- `SpanTransformer`
- `TokenAttributes`
- `UsageAttributes`
- `WellKnownOperationName`
- `WellKnownSystem`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect } from "effect"
import { Telemetry } from "effect/unstable/ai"

// Add telemetry attributes to a span
const addTelemetry = Effect.gen(function*() {
  const span = yield* Effect.currentSpan

  Telemetry.addGenAIAnnotations(span, {
    system: "openai",
    operation: { name: "chat" },
    request: {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000
    },
    usage: {
      inputTokens: 100,
      outputTokens: 50
    }
  })
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
  - `effect-facet-unstable-ai-languagemodel` (effect/unstable/ai/LanguageModel)
  - `effect-facet-unstable-ai-mcpschema` (effect/unstable/ai/McpSchema)
  - `effect-facet-unstable-ai-mcpserver` (effect/unstable/ai/McpServer)
  - `effect-facet-unstable-ai-model` (effect/unstable/ai/Model)
  - `effect-facet-unstable-ai-openaistructuredoutput` (effect/unstable/ai/OpenAiStructuredOutput)
  - `effect-facet-unstable-ai-prompt` (effect/unstable/ai/Prompt)
  - `effect-facet-unstable-ai-response` (effect/unstable/ai/Response)
  - `effect-facet-unstable-ai-tokenizer` (effect/unstable/ai/Tokenizer)
  - `effect-facet-unstable-ai-tool` (effect/unstable/ai/Tool)
  - `effect-facet-unstable-ai-toolkit` (effect/unstable/ai/Toolkit)
- Parent module ownership belongs to `effect-module-unstable-ai`.

## Escalate to

- `effect-module-unstable-ai` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/ai/Telemetry.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
