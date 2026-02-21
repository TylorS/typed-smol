# API Reference: effect/unstable/ai/Tool

- Import path: `effect/unstable/ai/Tool`
- Source file: `packages/effect/src/unstable/ai/Tool.ts`
- Function exports (callable): 11
- Non-function exports: 42

## Purpose

The `Tool` module provides functionality for defining and managing tools that language models can call to augment their capabilities.

## Key Function Exports

- `dynamic`
- `getDescription`
- `getJsonSchema`
- `getJsonSchemaFromSchema`
- `getStrictMode`
- `isDynamic`
- `isProviderDefined`
- `isUserDefined`
- `make`
- `providerDefined`
- `unsafeSecureJsonParse`

## All Function Signatures

```ts
export declare const dynamic: <const Name extends string, const Options extends { readonly description?: string | undefined; readonly parameters?: Schema.Top | JsonSchema.JsonSchema | undefined; readonly success?: Schema.Top | undefined; readonly failure?: Schema.Top | undefined; readonly failureMode?: FailureMode | undefined; readonly needsApproval?: NeedsApproval<any> | undefined; }>(name: Name, options?: Options): Dynamic<Name, { readonly parameters: Options extends { readonly parameters: infer P; } ? P extends Schema.Top ? P : P extends JsonSchema.JsonSchema ? P : typeof Schema.Unknown : typeof Schema.Unknown; readonly success: Options extends { readonly success: infer S extends Schema.Top; } ? S : typeof Schema.Unknown; readonly failure: Options extends { readonly failure: infer F extends Schema.Top; } ? F : typeof Schema.Never; readonly failureMode: Options extends { readonly failureMode: infer M extends FailureMode; } ? M : "error"; }>;
export declare const getDescription: <Tool extends Any>(tool: Tool): string | undefined;
export declare const getJsonSchema: <Tool extends Any>(tool: Tool, options?: { readonly transformer?: CodecTransformer; }): JsonSchema.JsonSchema;
export declare const getJsonSchemaFromSchema: <S extends Schema.Top>(schema: S, options?: { readonly transformer?: CodecTransformer; }): JsonSchema.JsonSchema;
export declare const getStrictMode: <T extends Any>(tool: T): boolean | undefined;
export declare const isDynamic: (u: unknown): u is Dynamic<string, any>;
export declare const isProviderDefined: (u: unknown): u is ProviderDefined<`${string}.${string}`, string, any>;
export declare const isUserDefined: (u: unknown): u is Tool<string, any, any>;
export declare const make: <const Name extends string, Parameters extends Schema.Top = Schema.Void, Success extends Schema.Top = Schema.Void, Failure extends Schema.Top = Schema.Never, Mode extends FailureMode | undefined = undefined, Dependencies extends Array<ServiceMap.Service<any, any>> = []>(name: Name, options?: { readonly description?: string | undefined; readonly parameters?: Parameters | undefined; readonly success?: Success | undefined; readonly failure?: Failure | undefined; readonly failureMode?: Mode; readonly dependencies?: Dependencies | undefined; readonly needsApproval?: NeedsApproval<Parameters> | undefined; }): Tool<Name, { readonly parameters: Parameters; readonly success: Success; readonly failure: Failure; readonly failureMode: Mode extends undefined ? "error" : Mode; }, ServiceMap.Service.Identifier<Dependencies[number]>>;
export declare const providerDefined: <const Identifier extends `${string}.${string}`, const Name extends string, Args extends Schema.Top = Schema.Void, Parameters extends Schema.Top = Schema.Void, Success extends Schema.Top = Schema.Void, Failure extends Schema.Top = Schema.Never, RequiresHandler extends boolean = false>(options: { readonly id: Identifier; readonly customName: Name; readonly providerName: string; readonly args?: Args | undefined; readonly requiresHandler?: RequiresHandler | undefined; readonly parameters?: Parameters | undefined; readonly success?: Success | undefined; readonly failure?: Failure | undefined; }): <Mode extends FailureMode | undefined = undefined>(args: RequiresHandler extends true ? Struct.Simplify<Args["Encoded"] & { readonly failureMode?: Mode | undefined; }> : Struct.Simplify<Args["Encoded"]>) => ProviderDefined<Identifier, Name, { readonly args: Args; readonly parameters: Parameters; readonly success: Success; readonly failure: Failure; readonly failureMode: Mode extends undefined ? "error" : Mode; }, RequiresHandler>;
export declare const unsafeSecureJsonParse: (text: string): unknown;
```

## Other Exports (Non-Function)

- `Any` (interface)
- `AnyDynamic` (interface)
- `AnyProviderDefined` (interface)
- `Destructive` (variable)
- `Dynamic` (interface)
- `DynamicTypeId` (type)
- `Failure` (type)
- `FailureEncoded` (type)
- `FailureMode` (type)
- `FailureResult` (type)
- `FailureResultEncoded` (type)
- `Handler` (interface)
- `HandlerError` (type)
- `HandlerOutput` (type)
- `HandlerResult` (interface)
- `HandlerServices` (type)
- `HandlersFor` (type)
- `Idempotent` (variable)
- `Name` (type)
- `NameMapper` (class)
- `NeedsApproval` (type)
- `NeedsApprovalContext` (interface)
- `NeedsApprovalFunction` (type)
- `OpenWorld` (variable)
- `Parameters` (type)
- `ParametersEncoded` (type)
- `ParametersSchema` (type)
- `ProviderDefined` (interface)
- `ProviderDefinedTypeId` (type)
- `Readonly` (variable)
- `RequiresHandler` (type)
- `Result` (type)
- `ResultDecodingServices` (type)
- `ResultEncoded` (type)
- `ResultEncodingServices` (type)
- `Strict` (variable)
- `Success` (type)
- `SuccessEncoded` (type)
- `SuccessSchema` (type)
- `Title` (class)
- `Tool` (interface)
- `TypeId` (type)
