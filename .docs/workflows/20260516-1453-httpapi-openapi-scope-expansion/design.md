# HttpApi OpenAPI Scope Expansion Design

## Goal

Expand `api:` virtual-module OpenAPI support without changing the existing convention names. `_api.ts` remains the API root control module, `_group.ts` remains the group control module, and endpoint primary/companion files attach endpoint annotations.

## Config Surface

Root `_api.ts` may export:

```ts
export const openapi = {
  generation: {
    additionalProperties: false,
  },
  exposure: {
    jsonPath: "/openapi.json",
    swaggerPath: "/swagger",
    scalar: {
      path: "/docs",
      source: "cdn",
      version: "1.25.0",
      config: { theme: "moon" },
    },
  },
  annotations: {
    title: "My API",
    version: "1.0.0",
  },
}
```

`additionalProperties` is binary only:

- `false` means strict object schemas.
- `true` means allow additional object properties.
- object-shaped schema rewriting is out of scope and should produce a structured diagnostic.

Group `_group.ts` may export:

```ts
export const openapi = {
  annotations: {
    title: "Users",
    description: "User management endpoints",
  },
}
```

Endpoint primary modules may export:

```ts
export const openapi = {
  annotations: {
    summary: "List users",
    description: "Returns visible users",
  },
}
```

Endpoint companion `<endpoint>.openapi.ts` may default-export the same endpoint annotation shape. Directory `_openapi.ts` may default-export inherited endpoint annotation defaults.

## Scope Rules

- `_api.ts`: supports `openapi.generation`, `openapi.exposure`, and `openapi.annotations`.
- `_group.ts`: supports `openapi.annotations` only.
- endpoint primary modules: support `openapi.annotations` only.
- `<endpoint>.openapi.ts`: supports endpoint `annotations` only.
- `_openapi.ts`: supports inherited endpoint annotation defaults only.
- any `generation` or `exposure` outside root `_api.ts` is a structured diagnostic.
- unsupported annotation keys are structured diagnostics.

## Emission Model

Installed `effect@4.0.0-beta.66` exposes `OpenApi.fromApi(Api)` without an options parameter, while current official Effect docs show `additionalPropertiesStrategy` on newer APIs. This tranche must keep emitted source compatible with local installed declarations.

The implementation should therefore:

- avoid `OpenApi.fromApi(Api, ...)`;
- translate binary `additionalProperties` into a deterministic API-scope OpenAPI transform annotation;
- keep root exposure emitted through installed APIs:
  - `HttpApiBuilder.layer(Api, { openapiPath })`,
  - `HttpApiSwagger.layer(Api, { path })`,
  - `HttpApiScalar.layer(Api, { path, scalar })`,
  - `HttpApiScalar.layerCdn(Api, { path, scalar, version })`;
- emit group annotations with `HttpApiGroup...annotateMerge(OpenApiModule.annotations(...))`;
- emit endpoint annotations with `HttpApiEndpoint...annotateMerge(OpenApiModule.annotations(...))`.

## Precedence

Endpoint annotation precedence is:

1. endpoint in-file `openapi.annotations`;
2. sibling `<endpoint>.openapi.ts` default export;
3. nearest `_openapi.ts`;
4. ancestor `_openapi.ts` up to the API root.

Merged annotation objects should be deterministic. Later/higher-precedence layers override earlier keys.

## Testing Standard

Each implementation slice must start red and end green. Generated HttpApi source must be type-checked with the existing `packages/app` generated-source harness, not only snapshot-asserted.

