# Usage Reference: effect/unstable/ai/McpServer

- Import path: `effect/unstable/ai/McpServer`

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
import { NodeRuntime, NodeStdio } from "@effect/platform-node"
import { Effect, Layer, Logger, Schema } from "effect"
import { McpSchema, McpServer } from "effect/unstable/ai"

const idParam = McpSchema.param("id", Schema.Number)

// Define a resource template for a README file
const ReadmeTemplate = McpServer.resource`file://readme/${idParam}`({
  name: "README Template",
  // You can add auto-completion for the ID parameter
  completion: {
    id: (_) => Effect.succeed([1, 2, 3, 4, 5])
  },
  content: Effect.fn(function*(_uri, id) {
    return `# MCP Server Demo - ID: ${id}`
  })
})

// Define a test prompt with parameters
const TestPrompt = McpServer.prompt({
  name: "Test Prompt",
  description: "A test prompt to demonstrate MCP server capabilities",
  parameters: {
    flightNumber: Schema.String
```

## Test Anchors

- `packages/effect/test/unstable/ai/AiError.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/ai/LanguageModel.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Tool.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `prompt` (78)
- `toolkit` (69)
- `layer` (6)
