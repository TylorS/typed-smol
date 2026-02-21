# API Reference: effect/unstable/ai/McpSchema

- Import path: `effect/unstable/ai/McpSchema`
- Source file: `packages/effect/src/unstable/ai/McpSchema.ts`
- Function exports (callable): 4
- Non-function exports: 110

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isParam`
- `optional`
- `optionalWithDefault`
- `param`

## All Function Signatures

```ts
export declare const isParam: (schema: Schema.Top): schema is Param<string, Schema.Top>;
export declare const optional: <S extends Schema.Top>(schema: S): Schema.decodeTo<Schema.optional<S>, Schema.optionalKey<S>>;
export declare const optionalWithDefault: <S extends Schema.Top & Schema.WithoutConstructorDefault>(schema: S, defaultValue: () => Schema.optionalKey<S>["Type"]): optionalWithDefault<S>;
export declare const param: <const Name extends string, S extends Schema.Top>(name: Name, schema: S): Param<Name, S>;
```

## Other Exports (Non-Function)

- `Annotations` (class)
- `AudioContent` (class)
- `BlobResourceContents` (class)
- `CallTool` (class)
- `CallToolResult` (class)
- `CancelledNotification` (class)
- `ClientCapabilities` (class)
- `ClientFailureEncoded` (type)
- `ClientNotificationEncoded` (type)
- `ClientNotificationRpcs` (class)
- `ClientRequestEncoded` (type)
- `ClientRequestRpcs` (class)
- `ClientRpcs` (class)
- `ClientSuccessEncoded` (type)
- `Complete` (class)
- `CompleteResult` (class)
- `ContentBlock` (variable)
- `CreateMessage` (class)
- `CreateMessageResult` (class)
- `Cursor` (type)
- `Elicit` (class)
- `ElicitAcceptResult` (class)
- `ElicitationDeclined` (class)
- `ElicitDeclineResult` (class)
- `ElicitResult` (variable)
- `EmbeddedResource` (class)
- `FailureEncoded` (type)
- `FromClientEncoded` (type)
- `FromServerEncoded` (type)
- `GetPrompt` (class)
- `GetPromptResult` (class)
- `ImageContent` (class)
- `Implementation` (class)
- `Initialize` (class)
- `InitializedNotification` (class)
- `InitializeResult` (class)
- `INTERNAL_ERROR_CODE` (variable)
- `InternalError` (class)
- `INVALID_PARAMS_ERROR_CODE` (variable)
- `INVALID_REQUEST_ERROR_CODE` (variable)
- `InvalidParams` (class)
- `InvalidRequest` (class)
- `ListPrompts` (class)
- `ListPromptsResult` (class)
- `ListResources` (class)
- `ListResourcesResult` (class)
- `ListResourceTemplates` (class)
- `ListResourceTemplatesResult` (class)
- `ListRoots` (class)
- `ListRootsResult` (class)
- `ListTools` (class)
- `ListToolsResult` (class)
- `LoggingLevel` (type)
- `LoggingMessageNotification` (class)
- `McpError` (class)
- `McpServerClient` (class)
- `McpServerClientMiddleware` (class)
- `METHOD_NOT_FOUND_ERROR_CODE` (variable)
- `MethodNotFound` (class)
- `ModelHint` (class)
- `ModelPreferences` (class)
- `NotificationEncoded` (type)
- `NotificationMeta` (class)
- `PaginatedRequestMeta` (class)
- `PaginatedResultMeta` (class)
- `Param` (interface)
- `PARSE_ERROR_CODE` (variable)
- `ParseError` (class)
- `Ping` (class)
- `ProgressNotification` (class)
- `ProgressToken` (type)
- `Prompt` (class)
- `PromptArgument` (class)
- `PromptListChangedNotification` (class)
- `PromptMessage` (class)
- `PromptReference` (class)
- `ReadResource` (class)
- `ReadResourceResult` (class)
- `RequestEncoded` (type)
- `RequestId` (type)
- `RequestMeta` (class)
- `Resource` (class)
- `ResourceContents` (class)
- `ResourceLink` (class)
- `ResourceListChangedNotification` (class)
- `ResourceReference` (class)
- `ResourceTemplate` (class)
- `ResourceUpdatedNotification` (class)
- `ResultMeta` (class)
- `Role` (type)
- `Root` (class)
- `RootsListChangedNotification` (class)
- `SamplingMessage` (class)
- `ServerCapabilities` (class)
- `ServerFailureEncoded` (type)
- `ServerNotificationEncoded` (type)
- `ServerNotificationRpcs` (class)
- `ServerRequestEncoded` (type)
- `ServerRequestRpcs` (class)
- `ServerResultEncoded` (type)
- `ServerSuccessEncoded` (type)
- `SetLevel` (class)
- `Subscribe` (class)
- `SuccessEncoded` (type)
- `TextContent` (class)
- `TextResourceContents` (class)
- `Tool` (class)
- `ToolAnnotations` (class)
- `ToolListChangedNotification` (class)
- `Unsubscribe` (class)
