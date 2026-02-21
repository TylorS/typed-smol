# API Reference: effect/unstable/ai/Response

- Import path: `effect/unstable/ai/Response`
- Source file: `packages/effect/src/unstable/ai/Response.ts`
- Function exports (callable): 10
- Non-function exports: 76

## Purpose

The `Response` module provides data structures to represent responses from large language models.

## Key Function Exports

- `AllParts`
- `isPart`
- `makePart`
- `Part`
- `StreamPart`
- `toolApprovalRequestPart`
- `toolCallPart`
- `ToolCallPart`
- `toolResultPart`
- `ToolResultPart`

## All Function Signatures

```ts
export declare const AllParts: <T extends Toolkit.Any | Toolkit.WithHandler<any>>(toolkit: T): Schema.Codec<AllParts<T extends Toolkit.Any ? Toolkit.Tools<T> : Toolkit.WithHandlerTools<T>>, AllPartsEncoded, Tool.ResultDecodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>, Tool.ResultEncodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>>;
export declare const isPart: (u: unknown): u is AnyPart;
export declare const makePart: <const Type extends AnyPart["type"]>(type: Type, params: Omit<Extract<AnyPart, { type: Type; }>, typeof PartTypeId | "type" | "metadata"> & { readonly metadata?: Extract<AnyPart, { type: Type; }>["metadata"] | undefined; }): Extract<AnyPart, { type: Type; }>;
export declare const Part: <T extends Toolkit.Any | Toolkit.WithHandler<any>>(toolkit: T): Schema.Codec<Part<T extends Toolkit.Any ? Toolkit.Tools<T> : Toolkit.WithHandlerTools<T>>, PartEncoded, Tool.ResultDecodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>, Tool.ResultEncodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>>;
export declare const StreamPart: <T extends Toolkit.Any | Toolkit.WithHandler<any>>(toolkit: T): Schema.Codec<StreamPart<T extends Toolkit.Any ? Toolkit.Tools<T> : Toolkit.WithHandlerTools<T>>, StreamPartEncoded, Tool.ResultDecodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>, Tool.ResultEncodingServices<Toolkit.Tools<T>[keyof Toolkit.Tools<T>]>>;
export declare const toolApprovalRequestPart: (params: ConstructorParams<ToolApprovalRequestPart>): ToolApprovalRequestPart;
export declare const toolCallPart: <const Name extends string, Params>(params: ConstructorParams<ToolCallPart<Name, Params>>): ToolCallPart<Name, Params>;
export declare const ToolCallPart: <const Name extends string, Params extends Schema.Top>(name: Name, params: Params): Schema.Struct<{ readonly type: Schema.Literal<"tool-call">; readonly id: Schema.String; readonly name: Schema.Literal<Name>; readonly params: Params; readonly providerExecuted: Schema.withDecodingDefaultKey<Schema.Boolean>; readonly "~effect/ai/Content/Part": Schema.withDecodingDefaultKey<Schema.tag<"~effect/ai/Content/Part">>; readonly metadata: Schema.withDecodingDefault<Schema.$Record<Schema.String, Schema.Codec<Schema.Json>>>; }>;
export declare const toolResultPart: <const Params extends ConstructorParams<ToolResultPart<string, unknown, unknown>>>(params: Params): Params extends { readonly name: infer Name extends string; readonly isFailure: false; readonly result: infer Success; } ? ToolResultPart<Name, Success, never> : Params extends { readonly name: infer Name extends string; readonly isFailure: true; readonly result: infer Failure; } ? ToolResultPart<Name, never, Failure> : never;
export declare const ToolResultPart: <const Name extends string, Success extends Schema.Top, Failure extends Schema.Top>(name: Name, success: Success, failure: Failure): Schema.decodeTo<Schema.Struct<{ readonly "~effect/ai/Content/Part": Schema.Literal<"~effect/ai/Content/Part">; readonly result: Schema.Union<readonly [Success, Failure]>; readonly providerExecuted: Schema.Boolean; readonly metadata: Schema.$Record<Schema.String, Schema.NullOr<Schema.Codec<Schema.Json>>>; readonly encodedResult: Schema.toEncoded<Schema.Union<readonly [Success, Failure]>>; readonly preliminary: Schema.Boolean; readonly id: Schema.String; readonly type: Schema.Literal<"tool-result">; readonly isFailure: Schema.Boolean; readonly name: Schema.Literal<Name>; }>, Schema.Struct<{ readonly result: Schema.toEncoded<Schema.Union<readonly [Success, Failure]>>; readonly providerExecuted: Schema.optional<Schema.Boolean>; readonly metadata: Schema.optional<Schema.$Record<Schema.String, Schema.NullOr<Schema.Codec<Schema.Json>>>>; readonly preliminary: Schema.optional<Schema.Boolean>; readonly id: Schema.String; readonly type: Schema.Literal<"tool-result">; readonly isFailure: Schema.Boolean; readonly name: Schema.Literal<Name>; }>>;
```

## Other Exports (Non-Function)

- `AllPartsEncoded` (type)
- `AnyPart` (type)
- `AnyPartEncoded` (type)
- `BasePart` (interface)
- `BasePartEncoded` (interface)
- `BaseToolResult` (interface)
- `ConstructorParams` (type)
- `DocumentSourcePart` (interface)
- `DocumentSourcePartEncoded` (interface)
- `DocumentSourcePartMetadata` (interface)
- `ErrorPart` (interface)
- `ErrorPartEncoded` (interface)
- `ErrorPartMetadata` (interface)
- `FilePart` (interface)
- `FilePartEncoded` (interface)
- `FilePartMetadata` (interface)
- `FinishPart` (interface)
- `FinishPartEncoded` (interface)
- `FinishPartMetadata` (interface)
- `FinishReason` (type)
- `HttpRequestDetails` (variable)
- `HttpResponseDetails` (variable)
- `PartEncoded` (type)
- `ProviderMetadata` (type)
- `ReasoningDeltaPart` (interface)
- `ReasoningDeltaPartEncoded` (interface)
- `ReasoningDeltaPartMetadata` (interface)
- `ReasoningEndPart` (interface)
- `ReasoningEndPartEncoded` (interface)
- `ReasoningEndPartMetadata` (interface)
- `ReasoningPart` (interface)
- `ReasoningPartEncoded` (interface)
- `ReasoningPartMetadata` (interface)
- `ReasoningStartPart` (interface)
- `ReasoningStartPartEncoded` (interface)
- `ReasoningStartPartMetadata` (interface)
- `ResponseMetadataPart` (interface)
- `ResponseMetadataPartEncoded` (interface)
- `ResponseMetadataPartMetadata` (interface)
- `StreamPartEncoded` (type)
- `TextDeltaPart` (interface)
- `TextDeltaPartEncoded` (interface)
- `TextDeltaPartMetadata` (interface)
- `TextEndPart` (interface)
- `TextEndPartEncoded` (interface)
- `TextEndPartMetadata` (interface)
- `TextPart` (interface)
- `TextPartEncoded` (interface)
- `TextPartMetadata` (interface)
- `TextStartPart` (interface)
- `TextStartPartEncoded` (interface)
- `TextStartPartMetadata` (interface)
- `ToolApprovalRequestPart` (interface)
- `ToolApprovalRequestPartEncoded` (interface)
- `ToolApprovalRequestPartMetadata` (interface)
- `ToolCallPartEncoded` (interface)
- `ToolCallPartMetadata` (interface)
- `ToolCallParts` (type)
- `ToolParamsDeltaPart` (interface)
- `ToolParamsDeltaPartEncoded` (interface)
- `ToolParamsDeltaPartMetadata` (interface)
- `ToolParamsEndPart` (interface)
- `ToolParamsEndPartEncoded` (interface)
- `ToolParamsEndPartMetadata` (interface)
- `ToolParamsStartPart` (interface)
- `ToolParamsStartPartEncoded` (interface)
- `ToolParamsStartPartMetadata` (interface)
- `ToolResultFailure` (interface)
- `ToolResultPartEncoded` (interface)
- `ToolResultPartMetadata` (interface)
- `ToolResultParts` (type)
- `ToolResultSuccess` (interface)
- `UrlSourcePart` (interface)
- `UrlSourcePartEncoded` (interface)
- `UrlSourcePartMetadata` (interface)
- `Usage` (class)
