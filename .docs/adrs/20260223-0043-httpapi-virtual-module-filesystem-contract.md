## Status

proposed

## Context

We need a companion to `RouterVirtualModulePlugin` that resolves `api:./<directory>` and generates `HttpApi`-based API assembly modules with strong structural typing and deterministic behavior.

Key constraints:

- Must remain synchronous and compatible with existing `@typed/virtual-modules` host integrations.
- Must preserve deterministic convention resolution and diagnostics.
- Must provide a high-convenience filesystem model while preserving end-to-end type safety.
- Must align with Effect `HttpApi` / `HttpApiGroup` / `HttpApiBuilder` composition semantics.

## Decision

Adopt a **filesystem-first HttpApi contract** with explicit precedence and structural validation:

1. **Module syntax and resolution**
   - Resolve `api:./<directory>` exactly like router plugin path semantics.

2. **Directory-to-group mapping**
   - Directories map to named `HttpApiGroup`s by default.
   - Parenthesized directories (for example `(internal)`) are pathless organizational nodes and do not create a group named after the directory.

3. **Endpoint contract**
   - Endpoint leaf files must define route + method + request/headers + response/error schema shapes + handler.
   - Endpoint schema contract is centered on `Schema.TaggedRequest`.

4. **Supported file-role matrix**
   - API root: `_api.ts`.
   - Group override: `_group.ts`.
   - Endpoint primary: `<endpoint>.ts`.
   - Endpoint companions: `<endpoint>.name.ts`, `<endpoint>.dependencies.ts`, `<endpoint>.middlewares.ts`, `<endpoint>.prefix.ts`, `<endpoint>.openapi.ts`.
   - Directory companions: `_dependencies.ts`, `_middlewares.ts`, `_prefix.ts`, `_openapi.ts`.
   - Unsupported reserved companion names are explicit diagnostics.

5. **Convention precedence**
   - Use router-style precedence for concern resolution:
     - in-file first,
     - sibling companion second,
     - directory-level companion third (ancestor-to-leaf composition).

6. **Generated output responsibilities**
   - Emit API assembly and builder-wiring exports.
   - Include easy OpenAPI control surfaces for generated specification behavior.

7. **Validation model**
   - Use `TypeInfoApi` structural assignability targets (`assignableTo`) for contract checks.
   - Do not rely on string-only type-name parsing as primary validation.

8. **Compiler pipeline shape**
   - Parse discovered files/directories into a deterministic tree AST first.
   - Render TypeScript source from AST + validated descriptors; no direct file-to-string emission path.

9. **Vite integration**
   - Integrate as a first-class plugin in `@typed/vite-plugin` beside router VM support.
   - Expose explicit option wiring (`apiVmOptions`) and deterministic registration order.

10. **Typed handler helper**
   - Provide a curried helper (working name `defineApiHandler`) for authoring endpoint handlers from `(route, method, request)` with generator-style context inference.
   - Require compile-time enforcement of inferred input/output/error shapes from route + `Schema.TaggedRequest`.

11. **OpenAPI configuration contract**
   - Support only Effect-backed OpenAPI controls from current source:
     - annotations via `OpenApi.annotations` keys (`identifier`, `title`, `version`, `description`, `license`, `summary`, `deprecated`, `externalDocs`, `servers`, `format`, `override`, `exclude`, `transform`),
     - spec generation via `OpenApi.fromApi(..., { additionalProperties })`,
     - exposure via JSON (`HttpApiBuilder.layer openapiPath` equivalent), Swagger (`HttpApiSwagger.layer path` equivalent), and Scalar (`HttpApiScalar.layer/layerCdn` equivalents).
   - Enforce scope and route-conflict diagnostics for invalid OpenAPI configurations.

## Consequences

Positive:

- Keeps developer ergonomics close to router virtual-module workflows.
- Gives explicit control for advanced API concerns without abandoning conventions.
- Maintains deterministic, auditable behavior for generated modules.
- Preserves strong type safety around endpoint contracts and builder wiring.
- Improves maintainability by separating parse/AST concerns from source-rendering concerns.
- Reduces integration friction by treating Vite support as a first-class contract, not a follow-up.
- Provides a single ergonomic, strongly typed authoring pattern for handlers.
- Makes OpenAPI behavior explicit and version-aligned with Effect capabilities.

Trade-offs:

- Broader convention surface increases implementation and test scope.
- Requires new `resolveHttpApiTypeTargets` helper and additional fixture coverage.
- Needs careful version isolation from unstable Effect HttpApi APIs.
- Adds implementation/test complexity for AST lifecycle and Vite integration wiring.
- Adds type-level API surface that must be kept stable and well-tested for inference regressions.
- Adds additional validation complexity for OpenAPI key/scope/routing conflicts.

## Alternatives considered

1. **Convention-only, no explicit override files**
   - Rejected: too rigid for advanced group/OpenAPI/security customization.
2. **Manifest-only API definition (single root file)**
   - Rejected: loses ergonomic filesystem composition and router parity.
3. **Runtime reflection-driven assembly without strict structural checks**
   - Rejected: weak diagnostics and lower type safety.

## References

- `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
- `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- `.docs/specs/router-virtual-module-plugin/spec.md`
- `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
- `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`
- `https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html`
- `https://effect-ts.github.io/effect/platform/HttpApiGroup.ts.html`
