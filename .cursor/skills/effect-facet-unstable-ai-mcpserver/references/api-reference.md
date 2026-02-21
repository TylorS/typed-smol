# API Reference: effect/unstable/ai/McpServer

- Import path: `effect/unstable/ai/McpServer`
- Source file: `packages/effect/src/unstable/ai/McpServer.ts`
- Function exports (callable): 11
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `elicit`
- `layer`
- `layerHttp`
- `layerStdio`
- `prompt`
- `registerPrompt`
- `registerResource`
- `registerToolkit`
- `resource`
- `run`
- `toolkit`

## All Function Signatures

```ts
export declare const elicit: <S extends Schema.Encoder<Record<string, unknown>, unknown>>(options: { readonly message: string; readonly schema: S; }): Effect.Effect<S["Type"], ElicitationDeclined, McpServerClient | S["DecodingServices"]>;
export declare const layer: (options: { readonly name: string; readonly version: string; }): Layer.Layer<McpServer | McpServerClient, never, RpcServer.Protocol>;
export declare const layerHttp: (options: { readonly name: string; readonly version: string; readonly path: HttpRouter.PathInput; }): Layer.Layer<McpServer | McpServerClient, never, HttpRouter.HttpRouter>;
export declare const layerStdio: (options: { readonly name: string; readonly version: string; }): Layer.Layer<McpServer | McpServerClient, never, Stdio>;
export declare const prompt: <E, R, Params extends Schema.Struct.Fields = {}, const Completions extends { readonly [K in keyof Params]?: (input: string) => Effect.Effect<Array<Params[K]["Type"]>, any, any>; } = {}>(options: { readonly name: string; readonly description?: string | undefined; readonly parameters?: Params | undefined; readonly completion?: ValidateCompletions<Completions, Extract<keyof Params, string>> | undefined; readonly content: (params: Schema.Struct.Type<Params>) => Effect.Effect<Array<typeof PromptMessage.Type> | string, E, R>; }): Layer.Layer<never, never, Exclude<Schema.Struct.DecodingServices<Params> | R, McpServerClient>>;
export declare const registerPrompt: <E, R, Params extends Schema.Struct.Fields = {}, const Completions extends { readonly [K in keyof Params]?: (input: string) => Effect.Effect<Array<Params[K]>, any, any>; } = {}>(options: { readonly name: string; readonly description?: string | undefined; readonly parameters?: Params | undefined; readonly completion?: ValidateCompletions<Completions, Extract<keyof Params, string>> | undefined; readonly content: (params: Params) => Effect.Effect<Array<typeof PromptMessage.Type> | string, E, R>; }): Effect.Effect<void, never, Exclude<Schema.Struct.DecodingServices<Params> | R, McpServerClient> | McpServer>;
export declare const registerResource: <E, R>(options: { readonly uri: string; readonly name: string; readonly description?: string | undefined; readonly mimeType?: string | undefined; readonly audience?: ReadonlyArray<"user" | "assistant"> | undefined; readonly priority?: number | undefined; readonly content: Effect.Effect<typeof ReadResourceResult.Type | string | Uint8Array, E, R>; }): Effect.Effect<void, never, Exclude<R, McpServerClient> | McpServer>; // overload 1
export declare const registerResource: <const Schemas extends ReadonlyArray<Schema.Top>>(segments: TemplateStringsArray, ...schemas: Schemas): <E, R, const Completions extends Partial<ResourceCompletions<Schemas>> = {}>(options: { readonly name: string; readonly description?: string | undefined; readonly mimeType?: string | undefined; readonly audience?: ReadonlyArray<"user" | "assistant"> | undefined; readonly priority?: number | undefined; readonly completion?: ValidateCompletions<Completions, keyof ResourceCompletions<Schemas>> | undefined; readonly content: (uri: string, ...params: { readonly [K in keyof Schemas]: Schemas[K]["Type"]; }) => Effect.Effect<typeof ReadResourceResult.Type | string | Uint8Array, E, R>; }) => Effect.Effect<void, never, Exclude<Schemas[number]["DecodingServices"] | Schemas[number]["EncodingServices"] | R | (Completions[keyof Completions] extends (input: string) => infer Ret ? Ret extends Effect.Effect<infer _A, infer _E, infer _R> ? _R : never : never), McpServerClient> | McpServer>; // overload 2
export declare const registerToolkit: <Tools extends Record<string, Tool.Any>>(toolkit: Toolkit.Toolkit<Tools>): Effect.Effect<void, never, McpServer | Tool.HandlersFor<Tools> | Exclude<Tool.HandlerServices<Tools>, McpServerClient>>;
export declare const resource: <E, R>(options: { readonly uri: string; readonly name: string; readonly description?: string | undefined; readonly mimeType?: string | undefined; readonly audience?: ReadonlyArray<"user" | "assistant"> | undefined; readonly priority?: number | undefined; readonly content: Effect.Effect<typeof ReadResourceResult.Type | string | Uint8Array, E, R>; }): Layer.Layer<never, never, Exclude<R, McpServerClient>>; // overload 1
export declare const resource: <const Schemas extends ReadonlyArray<Schema.Top>>(segments: TemplateStringsArray, ...schemas: Schemas): <E, R, const Completions extends Partial<ResourceCompletions<Schemas>> = {}>(options: { readonly name: string; readonly description?: string | undefined; readonly mimeType?: string | undefined; readonly audience?: ReadonlyArray<"user" | "assistant"> | undefined; readonly priority?: number | undefined; readonly completion?: ValidateCompletions<Completions, keyof ResourceCompletions<Schemas>> | undefined; readonly content: (uri: string, ...params: { readonly [K in keyof Schemas]: Schemas[K]["Type"]; }) => Effect.Effect<typeof ReadResourceResult.Type | string | Uint8Array, E, R>; }) => Layer.Layer<never, never, Exclude<R | (Completions[keyof Completions] extends (input: string) => infer Ret ? Ret extends Effect.Effect<infer _A, infer _E, infer _R> ? _R : never : never), McpServerClient>>; // overload 2
export declare const run: (options: { readonly name: string; readonly version: string; }): Effect.Effect<never, never, McpServer | RpcServer.Protocol>;
export declare const toolkit: <Tools extends Record<string, Tool.Any>>(toolkit: Toolkit.Toolkit<Tools>): Layer.Layer<never, never, Tool.HandlersFor<Tools> | Exclude<Tool.HandlerServices<Tools>, McpServerClient>>;
```

## Other Exports (Non-Function)

- `McpServer` (class)
- `ResourceCompletions` (type)
- `ValidateCompletions` (type)
