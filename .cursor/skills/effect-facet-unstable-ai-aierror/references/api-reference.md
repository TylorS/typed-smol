# API Reference: effect/unstable/ai/AiError

- Import path: `effect/unstable/ai/AiError`
- Source file: `packages/effect/src/unstable/ai/AiError.ts`
- Function exports (callable): 4
- Non-function exports: 24

## Purpose

The `AiError` module provides comprehensive, provider-agnostic error handling for AI operations.

## Key Function Exports

- `isAiError`
- `isAiErrorReason`
- `make`
- `reasonFromHttpStatus`

## All Function Signatures

```ts
export declare const isAiError: (u: unknown): u is AiError;
export declare const isAiErrorReason: (u: unknown): u is AiErrorReason;
export declare const make: (params: { readonly module: string; readonly method: string; readonly reason: AiErrorReason; }): AiError;
export declare const reasonFromHttpStatus: (params: { readonly status: number; readonly body?: unknown; readonly http?: typeof HttpContext.Type; readonly metadata?: typeof ProviderMetadata.Type; }): AiErrorReason;
```

## Other Exports (Non-Function)

- `AiError` (class)
- `AiErrorEncoded` (type)
- `AiErrorReason` (type)
- `AuthenticationError` (class)
- `ContentPolicyError` (class)
- `HttpContext` (variable)
- `InternalProviderError` (class)
- `InvalidOutputError` (class)
- `InvalidRequestError` (class)
- `InvalidToolResultError` (class)
- `InvalidUserInputError` (class)
- `NetworkError` (class)
- `ProviderMetadata` (type)
- `QuotaExhaustedError` (class)
- `RateLimitError` (class)
- `StructuredOutputError` (class)
- `ToolConfigurationError` (class)
- `ToolkitRequiredError` (class)
- `ToolNotFoundError` (class)
- `ToolParameterValidationError` (class)
- `ToolResultEncodingError` (class)
- `UnknownError` (class)
- `UnsupportedSchemaError` (class)
- `UsageInfo` (variable)
