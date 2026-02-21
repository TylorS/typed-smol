# API Reference: effect/unstable/ai/Prompt

- Import path: `effect/unstable/ai/Prompt`
- Source file: `packages/effect/src/unstable/ai/Prompt.ts`
- Function exports (callable): 23
- Non-function exports: 55

## Purpose

The `Prompt` module provides several data structures to simplify creating and combining prompts.

## Key Function Exports

- `appendSystem`
- `assistantMessage`
- `concat`
- `filePart`
- `fromMessages`
- `fromResponseParts`
- `isMessage`
- `isPart`
- `isPrompt`
- `make`
- `makeMessage`
- `makePart`
- `prependSystem`
- `reasoningPart`
- `setSystem`
- `systemMessage`
- `textPart`
- `toolApprovalRequestPart`

## All Function Signatures

```ts
export declare const appendSystem: (content: string): (self: Prompt) => Prompt; // overload 1
export declare const appendSystem: (self: Prompt, content: string): Prompt; // overload 2
export declare const assistantMessage: (params: MessageConstructorParams<AssistantMessage>): AssistantMessage;
export declare const concat: (input: RawInput): (self: Prompt) => Prompt; // overload 1
export declare const concat: (self: Prompt, input: RawInput): Prompt; // overload 2
export declare const filePart: (params: PartConstructorParams<FilePart>): FilePart;
export declare const fromMessages: (messages: ReadonlyArray<Message>): Prompt;
export declare const fromResponseParts: (parts: ReadonlyArray<Response.AnyPart>): Prompt;
export declare const isMessage: (u: unknown): u is Message;
export declare const isPart: (u: unknown): u is Part;
export declare const isPrompt: (u: unknown): u is Prompt;
export declare const make: (input: RawInput): Prompt;
export declare const makeMessage: <const Role extends Message["role"]>(role: Role, params: Omit<Extract<Message, { role: Role; }>, typeof MessageTypeId | "role" | "options"> & { readonly options?: Extract<Message, { role: Role; }>["options"] | undefined; }): Extract<Message, { role: Role; }>;
export declare const makePart: <const Type extends Part["type"]>(type: Type, params: Omit<Extract<Part, { type: Type; }>, typeof PartTypeId | "type" | "options"> & { readonly options?: Extract<Part, { type: Type; }>["options"] | undefined; }): Extract<Part, { type: Type; }>;
export declare const prependSystem: (content: string): (self: Prompt) => Prompt; // overload 1
export declare const prependSystem: (self: Prompt, content: string): Prompt; // overload 2
export declare const reasoningPart: (params: PartConstructorParams<ReasoningPart>): ReasoningPart;
export declare const setSystem: (content: string): (self: Prompt) => Prompt; // overload 1
export declare const setSystem: (self: Prompt, content: string): Prompt; // overload 2
export declare const systemMessage: (params: MessageConstructorParams<SystemMessage>): SystemMessage;
export declare const textPart: (params: PartConstructorParams<TextPart>): TextPart;
export declare const toolApprovalRequestPart: (params: PartConstructorParams<ToolApprovalRequestPart>): ToolApprovalRequestPart;
export declare const toolApprovalResponsePart: (params: PartConstructorParams<ToolApprovalResponsePart>): ToolApprovalResponsePart;
export declare const toolCallPart: (params: PartConstructorParams<ToolCallPart>): ToolCallPart;
export declare const toolMessage: (params: MessageConstructorParams<ToolMessage>): ToolMessage;
export declare const toolResultPart: (params: PartConstructorParams<ToolResultPart>): ToolResultPart;
export declare const userMessage: (params: MessageConstructorParams<UserMessage>): UserMessage;
```

## Other Exports (Non-Function)

- `AssistantMessage` (interface)
- `AssistantMessageEncoded` (interface)
- `AssistantMessageOptions` (interface)
- `AssistantMessagePart` (type)
- `AssistantMessagePartEncoded` (type)
- `BaseMessage` (interface)
- `BaseMessageEncoded` (interface)
- `BasePart` (interface)
- `BasePartEncoded` (interface)
- `ContentFromString` (variable)
- `empty` (variable)
- `FilePart` (interface)
- `FilePartEncoded` (interface)
- `FilePartOptions` (interface)
- `Message` (type)
- `MessageConstructorParams` (type)
- `MessageEncoded` (type)
- `Part` (type)
- `PartConstructorParams` (type)
- `PartEncoded` (type)
- `Prompt` (interface)
- `PromptEncoded` (interface)
- `ProviderOptions` (type)
- `RawInput` (type)
- `ReasoningPart` (interface)
- `ReasoningPartEncoded` (interface)
- `ReasoningPartOptions` (interface)
- `SystemMessage` (interface)
- `SystemMessageEncoded` (interface)
- `SystemMessageOptions` (interface)
- `TextPart` (interface)
- `TextPartEncoded` (interface)
- `TextPartOptions` (interface)
- `ToolApprovalRequestPart` (interface)
- `ToolApprovalRequestPartEncoded` (interface)
- `ToolApprovalRequestPartOptions` (interface)
- `ToolApprovalResponsePart` (interface)
- `ToolApprovalResponsePartEncoded` (interface)
- `ToolApprovalResponsePartOptions` (interface)
- `ToolCallPart` (interface)
- `ToolCallPartEncoded` (interface)
- `ToolCallPartOptions` (interface)
- `ToolMessage` (interface)
- `ToolMessageEncoded` (interface)
- `ToolMessageOptions` (interface)
- `ToolMessagePart` (type)
- `ToolMessagePartEncoded` (type)
- `ToolResultPart` (interface)
- `ToolResultPartEncoded` (interface)
- `ToolResultPartOptions` (interface)
- `UserMessage` (interface)
- `UserMessageEncoded` (interface)
- `UserMessageOptions` (interface)
- `UserMessagePart` (type)
- `UserMessagePartEncoded` (type)
