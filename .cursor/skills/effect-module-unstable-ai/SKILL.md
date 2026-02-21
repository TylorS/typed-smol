---
name: effect-module-unstable-ai
description: Guidance for `effect/unstable/ai` focused on APIs like Chat, Tool, and Model. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/ai

## Owned scope

- Owns only `effect/unstable/ai`.
- Source of truth: `packages/effect/src/unstable/ai/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Chat`
- `Tool`
- `Model`
- `Prompt`
- `AiError`
- `Toolkit`
- `Response`
- `McpSchema`
- `McpServer`
- `Telemetry`
- `Tokenizer`
- `IdGenerator`
- `LanguageModel`
- `AnthropicStructuredOutput`
- `OpenAiStructuredOutput`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Effect, Match } from "effect";
import type { AiError } from "effect/unstable/ai";

// Handle errors using Match on the reason
const handleAiError = Match.type<AiError.AiError>().pipe(
  Match.when({ reason: { _tag: "RateLimitError" } }, (err) =>
    Effect.logWarning(`Rate limited, retry after ${err.retryAfter}`),
  ),
  Match.when({ reason: { _tag: "AuthenticationError" } }, (err) =>
    Effect.logError(`Auth failed: ${err.reason.kind}`),
  ),
  Match.when({ reason: { isRetryable: true } }, (err) =>
    Effect.logWarning(`Transient error, retrying: ${err.message}`),
  ),
  Match.orElse((err) => Effect.logError(`Permanent error: ${err.message}`)),
);
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
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
  - `effect-facet-unstable-ai-toolkit` (effect/unstable/ai/Toolkit)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-ai-aierror`.

## Reference anchors

- Module source: `packages/effect/src/unstable/ai/index.ts`
- Representative tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
