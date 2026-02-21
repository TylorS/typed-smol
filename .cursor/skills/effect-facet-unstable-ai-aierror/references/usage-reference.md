# Usage Reference: effect/unstable/ai/AiError

- Import path: `effect/unstable/ai/AiError`

## What It Is For

The `AiError` module provides comprehensive, provider-agnostic error handling for AI operations.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Match } from "effect"
import type { AiError } from "effect/unstable/ai"

// Handle errors using Match on the reason
const handleAiError = Match.type<AiError.AiError>().pipe(
  Match.when(
    { reason: { _tag: "RateLimitError" } },
    (err) => Effect.logWarning(`Rate limited, retry after ${err.retryAfter}`)
  ),
  Match.when(
    { reason: { _tag: "AuthenticationError" } },
    (err) => Effect.logError(`Auth failed: ${err.reason.kind}`)
  ),
  Match.when(
    { reason: { isRetryable: true } },
    (err) => Effect.logWarning(`Transient error, retrying: ${err.message}`)
  ),
  Match.orElse((err) => Effect.logError(`Permanent error: ${err.message}`))
)
```

## Test Anchors

- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `AiError` (169)
- `make` (57)
- `RateLimitError` (24)
- `AuthenticationError` (18)
- `AiErrorReason` (16)
- `ToolParameterValidationError` (16)
- `ToolNotFoundError` (13)
- `StructuredOutputError` (12)
- `InvalidToolResultError` (11)
- `ToolConfigurationError` (11)
- `ToolResultEncodingError` (11)
- `UnknownError` (10)
- `UnsupportedSchemaError` (10)
- `InternalProviderError` (9)
- `reasonFromHttpStatus` (9)
