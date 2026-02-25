# @typed/app

## Intent

`@typed/app` is the **app-level virtual-module integration layer** for typed-smol. It powers `router:./path` and `api:./path` imports that generate typed route matchers and HttpApi clients from convention-based source. It provides a TypeInfo session for structural type-checking (assignableTo) and `defineApiHandler` for typed endpoint contracts.

## Key exports / surfaces

### Virtual module plugins

- **`createRouterVirtualModulePlugin`** — Resolves `router:./<directory>` imports. Discovers route files, validates `route` export and one-of `handler`/`template`/`default`, composes guards/dependencies/layout/catch, emits typed Matcher source.
- **`createHttpApiVirtualModulePlugin`** — Resolves `api:./<directory>` imports. Discovers endpoint files, validates `route`/`method`/`handler`, supports groups and companion files, emits typed Api + Client + OpenAPI.

### TypeInfo integration

- **`createTypeInfoApiSessionForApp`** — Session factory with router + HttpApi type target specs. Use when providing `createTypeInfoApiSession` to `typedVitePlugin` or vmc for assignableTo checks.
- **`APP_TYPE_TARGET_BOOTSTRAP_CONTENT`** — Bootstrap file content; include in program rootNames when the program has no imports from canonical type target modules.

### API handler helper

- **`defineApiHandler(route, method, schemas?)(handler)`** — Typed handler with path/query/headers/body decoding; success/error schemas for response encoding. Use `HttpApiSchema.status(code)` for status annotations.

### Parsing / resolution

- **`parseRouterVirtualModuleId`**, **`parseHttpApiVirtualModuleId`** — Parse virtual module IDs; return `{ ok, relativeDirectory }` or `{ ok: false, reason }`.
- **`resolveRouterTargetDirectory`**, **`resolveHttpApiTargetDirectory`** — Resolve target directory from id + importer path.

### Type targets

- **`ROUTER_TYPE_TARGET_SPECS`**, **`HTTPAPI_TYPE_TARGET_SPECS`** — Type target specs for structural validation.

### Dependencies

- `@typed/router`, `@typed/virtual-modules`, `effect`; peer: `typescript`.

## Architecture

Both plugins implement `VirtualModulePlugin` from `@typed/virtual-modules`. They are consumed by:

- **typedVitePlugin** (via `createTypedViteResolver`) — registers router then HttpApi plugin
- **vmc** (virtual-modules-compiler)
- **TS plugin** (virtual-modules-ts-plugin)

Router plugin: discovers route candidates, validates contract, resolves companion modules (guard, dependencies, layout, catch), composes ancestor→leaf, classifies entrypoint (fx/effect/stream/plain), emits Matcher source.

HttpApi plugin: discovers API root/groups/endpoints, validates contract (route, method, handler; optional headers, body, success, error), supports directory conventions (`_api.ts`, `_group.ts`, `(pathless)/`), emits Api assembly + builder layer + OpenAPI.

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Effect unstable/httpapi skills when modifying HttpApi plugin
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- Specs: `.docs/specs/router-virtual-module-plugin/spec.md`, `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- Siblings: `@typed/router`, `@typed/virtual-modules`, `@typed/vite-plugin`, `@typed/virtual-modules-vite`
- README for install, config, and API reference
- Root AGENTS.md for bootup/modes
