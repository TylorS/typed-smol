# API Reference: effect/unstable/ai/LanguageModel

- Import path: `effect/unstable/ai/LanguageModel`
- Source file: `packages/effect/src/unstable/ai/LanguageModel.ts`
- Function exports (callable): 6
- Non-function exports: 13

## Purpose

The `LanguageModel` module provides AI text generation capabilities with tool calling support.

## Key Function Exports

- `defaultCodecTransformer`
- `generateObject`
- `generateText`
- `getObjectName`
- `make`
- `streamText`

## All Function Signatures

```ts
export declare const defaultCodecTransformer: <T, E, RD, RE>(schema: Schema.Codec<T, E, RD, RE>): { readonly codec: Schema.Codec<T, unknown, RD, RE>; readonly jsonSchema: JsonSchema.JsonSchema; };
export declare const generateObject: <ObjectEncoded extends Record<string, any>, StructuredOutputSchema extends Schema.Encoder<ObjectEncoded, unknown>, Options extends NoExcessProperties<GenerateObjectOptions<any, StructuredOutputSchema>, Options>, Tools extends Record<string, Tool.Any> = {}>(options: Options & GenerateObjectOptions<Tools, StructuredOutputSchema>): Effect.Effect<GenerateObjectResponse<Tools, StructuredOutputSchema["Type"]>, ExtractError<Options>, ExtractServices<Options> | StructuredOutputSchema["DecodingServices"] | LanguageModel>;
export declare const generateText: <Options extends NoExcessProperties<GenerateTextOptions<any>, Options>, Tools extends Record<string, Tool.Any> = {}>(options: Options & GenerateTextOptions<Tools>): Effect.Effect<GenerateTextResponse<Tools>, ExtractError<Options>, LanguageModel | ExtractServices<Options>>;
export declare const getObjectName: <StructuredOutputSchema extends Schema.Top>(objectName: string | undefined, schema: StructuredOutputSchema): string;
export declare const make: (params: ConstructorParams): Effect.Effect<Service>;
export declare const streamText: <Options extends NoExcessProperties<GenerateTextOptions<any>, Options>, Tools extends Record<string, Tool.Any> = {}>(options: Options & GenerateTextOptions<Tools>): Stream.Stream<Response.StreamPart<Tools>, ExtractError<Options>, ExtractServices<Options> | LanguageModel>;
```

## Other Exports (Non-Function)

- `CodecTransformer` (type)
- `ConstructorParams` (interface)
- `CurrentCodecTransformer` (variable)
- `ExtractError` (type)
- `ExtractServices` (type)
- `GenerateObjectOptions` (interface)
- `GenerateObjectResponse` (class)
- `GenerateTextOptions` (interface)
- `GenerateTextResponse` (class)
- `LanguageModel` (class)
- `ProviderOptions` (interface)
- `Service` (interface)
- `ToolChoice` (type)
