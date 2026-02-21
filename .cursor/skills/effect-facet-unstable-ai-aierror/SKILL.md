---
name: effect-facet-unstable-ai-aierror
description: Guidance for facet `effect/unstable/ai/AiError` focused on APIs like make, ProviderMetadata, and isAiError. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/ai/AiError

## Owned scope

- Owns only `effect/unstable/ai/AiError`.
- Parent module: `effect/unstable/ai`.
- Source anchor: `packages/effect/src/unstable/ai/AiError.ts`.

## What it is for

- The `AiError` module provides comprehensive, provider-agnostic error handling for AI operations.

## API quick reference

- `make`
- `ProviderMetadata`
- `isAiError`
- `isAiErrorReason`
- `AiError`
- `UsageInfo`
- `HttpContext`
- `NetworkError`
- `UnknownError`
- `AiErrorReason`
- `AiErrorEncoded`
- `AuthenticationError`
- `ContentPolicyError`
- `InternalProviderError`
- `InvalidOutputError`
- `InvalidRequestError`
- `InvalidToolResultError`
- `InvalidUserInputError`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
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

- Sibling facets under the same parent are out of scope:
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
- Parent module ownership belongs to `effect-module-unstable-ai`.

## Escalate to

- `effect-module-unstable-ai` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/ai/AiError.ts`
- Parent tests: `packages/effect/test/unstable/ai/AiError.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Tool.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
