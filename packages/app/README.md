# @typed/app

> **Beta:** This package is in beta; APIs may change.

`@typed/app` provides **virtual module plugins** for the router and HttpApi stacks: `router:./path` and `api:./path` imports that generate typed route matchers and API clients from source. It also exports `createTypeInfoApiSessionForApp` for TypeInfo-backed type-checking and `defineApiHandler` for typed HttpApi endpoint contracts.

## Purpose

Typed-smol apps get typed routes and APIs from convention-based source without manual wiring. You place route and endpoint files in directories, follow the file conventions, and import `router:./routes` or `api:./endpoints` to receive generated Matcher and Client modules. The plugins are configured in `vmc.config.ts` and consumed by `typedVitePlugin`, vmc (virtual-modules-compiler), or the TS plugin.

## How to use

1. Add the plugins to `vmc.config.ts` (see Configuration below).
2. Import `router:./routes` and `api:./endpoints` in your app code to use the generated Matcher and Client.
3. (Optional) Provide `createTypeInfoApiSessionForApp` to `typedVitePlugin` for structural type-checking of route and endpoint contracts.

## Architecture

```mermaid
flowchart LR
  subgraph config [vmc.config.ts]
    VMC[plugins array]
  end

  subgraph consumers [Consumers]
    Vite[typedVitePlugin]
    VMC2[vmc]
    TS[TS plugin]
  end

  subgraph plugins [@typed/app plugins]
    Router[Router VM plugin]
    HttpApi[HttpApi VM plugin]
  end

  subgraph imports [App imports]
    RImport["router:./routes"]
    ApiImport["api:./endpoints"]
  end

  subgraph output [Generated output]
    Matcher[Matcher source]
    Client[Client + OpenAPI]
  end

  VMC --> Router
  VMC --> HttpApi
  Router --> Vite
  HttpApi --> Vite
  Vite --> RImport
  Vite --> ApiImport
  RImport --> Matcher
  ApiImport --> Client
```

## Companion file conventions

### Router plugin

| Pattern             | Role      | Behavior                           |
| ------------------- | --------- | ---------------------------------- |
| `*.guard.ts`        | Sibling   | Guard for this route               |
| `*.dependencies.ts` | Sibling   | Dependencies for this route        |
| `*.layout.ts`       | Sibling   | Layout wrapper                     |
| `*.catch.ts`        | Sibling   | Error catch handler                |
| `_guard.ts`         | Directory | Guard inherited by children        |
| `_dependencies.ts`  | Directory | Dependencies inherited by children |
| `_layout.ts`        | Directory | Layout inherited by children       |
| `_catch.ts`         | Directory | Catch inherited by children        |

Each route file must export `route` and exactly one of `handler`, `template`, or `default`.

### HttpApi plugin

| Pattern             | Role               | Behavior                                        |
| ------------------- | ------------------ | ----------------------------------------------- |
| `_api.ts`           | API root           | Top-level API defaults (name, prefix, openapi)  |
| `_group.ts`         | Group override     | Group name, prefix, dependencies, middlewares   |
| `_prefix.ts`        | Directory          | Path prefix for all endpoints in that directory |
| `*.prefix.ts`       | Endpoint companion | Path prefix for that endpoint                   |
| `(pathless)/`       | Pathless dir       | Organizational only, no path segment            |
| `*.name.ts`         | Endpoint companion | Override endpoint name                          |
| `*.dependencies.ts` | Endpoint companion | Endpoint dependencies                           |
| `*.middlewares.ts`  | Endpoint companion | Endpoint middlewares                            |
| `_dependencies.ts`  | Directory          | Inherited dependencies                          |
| `_middlewares.ts`   | Directory          | Inherited middlewares                           |

Each endpoint file must export `route`, `method`, and `handler`. See [router-virtual-module-plugin spec](../../.docs/specs/router-virtual-module-plugin/spec.md) and [httpapi-virtual-module-plugin spec](../../.docs/specs/httpapi-virtual-module-plugin/spec.md) for full details.

### Path prefix

Path prefix for API routes can be set via:

1. **Convention files** – `_api.ts`, `_group.ts`, `_prefix.ts`, or `*.prefix.ts` exporting a **Route from `@typed/router`** (e.g. `Route.Parse("/api")`). Export name: `prefix` in `_api.ts`/`_group.ts`, `default` in `_prefix.ts`/`*.prefix.ts`.
2. **Plugin option** – `pathPrefix` when conventions are absent.

Precedence: group override > API root + ancestor `_prefix.ts` chain > plugin `pathPrefix`. All prefix exports are validated as Route; invalid exports produce `AVM-CONTRACT-007`.

### OpenAPI exposure (`_api.ts`)

In `_api.ts` you can export `openapi.exposure` to define where OpenAPI docs are served:

```ts
export const openapi = {
  exposure: {
    jsonPath: "/api/docs/spec" as const, // OpenAPI JSON spec
    swaggerPath: "/api/docs/swagger" as const,
    scalar: { path: "/api/docs" as const },
  },
};
```

These map to `HttpApiBuilder.layer(Api, { openapiPath })`, `HttpApiSwagger.layer(Api, { path })`, and `HttpApiScalar.layer(Api, { path })`.

## Dependencies

- `effect`
- `@typed/router`
- `@typed/virtual-modules`

Peer: `typescript`.

## Installation

```bash
pnpm add @typed/app @typed/router @typed/virtual-modules
```

## Configuration

Configure plugins in `vmc.config.ts` (used by vmc, the TS plugin, and typedVitePlugin):

```ts
// vmc.config.ts
import { createRouterVirtualModulePlugin, createHttpApiVirtualModulePlugin } from "@typed/app";

export default {
  plugins: [createRouterVirtualModulePlugin(), createHttpApiVirtualModulePlugin()],
};
```

## Example

```ts
// Import generated router matcher
import { Matcher } from "router:./routes";

// Import generated API client
import { Client } from "api:./endpoints";

// Define typed handler
import { defineApiHandler } from "@typed/app";
import { Route } from "@typed/router";
import * as Schema from "effect/Schema";

const handler = defineApiHandler(Route.Parse("/todos/:id"), "GET", {
  success: Schema.Struct({ id: Schema.String }),
})(({ path }) => Effect.succeed({ id: path.id }));
```

## API overview

- **Router VM plugin** — `createRouterVirtualModulePlugin(options)` — virtual `router:./routes` imports; scans route files, emits typed Matcher source.
- **HttpApi VM plugin** — `createHttpApiVirtualModulePlugin(options)` — virtual `api:./endpoints` imports; scans API files, emits typed Api + Client + OpenAPI.
- **TypeInfo session** — `createTypeInfoApiSessionForApp({ ts, program })` — session with router + HttpApi type targets; use with `typedVitePlugin` or vmc.
- **API handler helper** — `defineApiHandler(route, method, schemas?)(handler)` — typed handler with path/query/headers/body; success/error schemas for responses.
- **Parsing helpers** — `parseRouterVirtualModuleId`, `parseHttpApiVirtualModuleId`; `resolveRouterTargetDirectory`, `resolveHttpApiTargetDirectory`.
- **Type target specs** — `ROUTER_TYPE_TARGET_SPECS`, `HTTPAPI_TYPE_TARGET_SPECS`; `APP_TYPE_TARGET_BOOTSTRAP_CONTENT`.

## API reference

### RouterVirtualModulePluginOptions

| Property | Type     | Default                   | Description                  |
| -------- | -------- | ------------------------- | ---------------------------- |
| `prefix` | `string` | `"router:"`               | Virtual module ID prefix.    |
| `name`   | `string` | `"router-virtual-module"` | Plugin name for diagnostics. |

### HttpApiVirtualModulePluginOptions

| Property     | Type               | Default                    | Description                                                      |
| ------------ | ------------------ | -------------------------- | ---------------------------------------------------------------- |
| `prefix`     | `string`           | `"api:"`                   | Virtual module ID prefix.                                        |
| `name`       | `string`           | `"httpapi-virtual-module"` | Plugin name for diagnostics.                                     |
| `pathPrefix` | `` `/${string}` `` | —                          | HTTP path prefix (e.g. `"/api"`) when no convention defines one. |

### createTypeInfoApiSessionForApp

Requires a TypeScript `program` that includes imports from canonical type target modules. If the program has no such imports, write `APP_TYPE_TARGET_BOOTSTRAP_CONTENT` to a file and include it in `rootNames`.
