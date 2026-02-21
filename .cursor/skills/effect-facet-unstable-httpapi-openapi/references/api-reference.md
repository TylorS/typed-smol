# API Reference: effect/unstable/httpapi/OpenApi

- Import path: `effect/unstable/httpapi/OpenApi`
- Source file: `packages/effect/src/unstable/httpapi/OpenApi.ts`
- Function exports (callable): 2
- Non-function exports: 35

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `annotations`
- `fromApi`

## All Function Signatures

```ts
export declare const annotations: (options: { readonly identifier?: string | undefined; readonly title?: string | undefined; readonly version?: string | undefined; readonly description?: string | undefined; readonly license?: OpenAPISpecLicense | undefined; readonly summary?: string | undefined; readonly deprecated?: boolean | undefined; readonly externalDocs?: OpenAPISpecExternalDocs | undefined; readonly servers?: ReadonlyArray<OpenAPISpecServer> | undefined; readonly format?: string | undefined; readonly override?: Record<string, unknown> | undefined; readonly exclude?: boolean | undefined; readonly transform?: ((openApiSpec: Record<string, any>) => Record<string, any>) | undefined; }): ServiceMap.ServiceMap<never>;
export declare const fromApi: <Id extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<Id, Groups>, options?: { readonly additionalProperties?: boolean | JsonSchema.JsonSchema | undefined; } | undefined): OpenAPISpec;
```

## Other Exports (Non-Function)

- `Deprecated` (class)
- `Description` (class)
- `Exclude` (variable)
- `ExternalDocs` (class)
- `Format` (class)
- `Identifier` (class)
- `License` (class)
- `OpenAPIApiKeySecurityScheme` (interface)
- `OpenAPIComponents` (interface)
- `OpenAPIHTTPSecurityScheme` (interface)
- `OpenAPISecurityRequirement` (type)
- `OpenAPISecurityScheme` (type)
- `OpenAPISpec` (interface)
- `OpenApiSpecContent` (type)
- `OpenAPISpecExternalDocs` (interface)
- `OpenAPISpecInfo` (interface)
- `OpenAPISpecLicense` (interface)
- `OpenApiSpecMediaType` (interface)
- `OpenAPISpecMethodName` (type)
- `OpenAPISpecOperation` (interface)
- `OpenAPISpecParameter` (interface)
- `OpenAPISpecPathItem` (type)
- `OpenAPISpecPaths` (type)
- `OpenAPISpecRequestBody` (interface)
- `OpenApiSpecResponse` (interface)
- `OpenAPISpecResponses` (type)
- `OpenAPISpecServer` (interface)
- `OpenAPISpecServerVariable` (interface)
- `OpenAPISpecTag` (interface)
- `Override` (class)
- `Servers` (class)
- `Summary` (class)
- `Title` (class)
- `Transform` (class)
- `Version` (class)
