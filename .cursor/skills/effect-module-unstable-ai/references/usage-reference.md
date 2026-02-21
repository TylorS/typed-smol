# Usage Reference: effect/unstable/ai

- Import path: `effect/unstable/ai`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
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
- `Prompt` (81)
- `Tool` (52)
- `Response` (42)
- `Toolkit` (36)
- `LanguageModel` (33)
- `Chat` (11)
- `IdGenerator` (3)
- `AnthropicStructuredOutput` (1)
