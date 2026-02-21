---
name: effect-facet-unstable-ai-prompt
description: Guidance for facet `effect/unstable/ai/Prompt` focused on APIs like make, empty, and makePart. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/Prompt

## Owned scope

- Owns only `effect/unstable/ai/Prompt`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/Prompt.ts`.

## What it is for

- The `Prompt` module provides several data structures to simplify creating and combining prompts.

## API quick reference

- `make`
- `empty`
- `makePart`
- `setSystem`
- `makeMessage`
- `fromMessages`
- `fromResponseParts`
- `ProviderOptions`
- `isPart`
- `isPrompt`
- `isMessage`
- `Part`
- `concat`
- `Prompt`
- `Message`
- `BasePart`
- `filePart`
- `FilePart`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Prompt } from "effect/unstable/ai"

// Create a structured conversation
const conversation = Prompt.make([
  {
    role: "system",
    content: "You are a helpful assistant specialized in mathematics."
  },
  {
    role: "user",
    content: [{
      type: "text",
      text: "What is the derivative of x²?"
    }]
  },
  {
    role: "assistant",
    content: [{
      type: "text",
      text: "The derivative of x² is 2x."
    }]
  }
])
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

- Facet source: `packages/effect/src/unstable/ai/Prompt.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
