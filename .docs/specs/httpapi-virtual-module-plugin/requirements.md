## Functional Requirements

- FR-1: The plugin shall resolve module IDs in the form `api:./<directory>` (and equivalent `api:<directory>`) relative to importer path using the synchronous `@typed/virtual-modules` plugin contract.
- FR-2: The plugin shall discover API source candidates from regular script files (`.ts/.tsx/.js/.jsx/.mts/.cts/.mjs/.cjs`) under the resolved directory with deterministic ordering and companion-file filtering.
- FR-3: The plugin shall support an optional root convention file (`_api.ts`) for top-level API metadata/overrides (identifier and top-level configuration).
- FR-4: The plugin shall map directories to named `HttpApiGroup`s by default, with support for parenthesized pathless directories (for example `(internal)`) that organize files without creating a group named after that directory.
- FR-5: The plugin shall support optional per-directory group convention files (`_group.ts`) for explicit group metadata and overrides, including group name override, dependencies, middlewares, and prefixes.
- FR-6: Endpoint leaf modules shall provide a complete endpoint contract, including route shape (path + query schema), HTTP method, request payload/headers schema, response/error schemas, and handler implementation.
- FR-7: Endpoint schema contracts shall be based on `Schema.TaggedRequest` as the core payload/error/response shape convention.
- FR-8: Endpoint names shall default to filename slug, with optional explicit name override via in-file or companion conventions.
- FR-9: The plugin shall support filesystem-driven mapping of core `HttpApiGroup` capabilities (at minimum: endpoint aggregation, `prefix`, shared errors, middleware, annotations).
- FR-10: The plugin shall support filesystem-driven mapping of core `HttpApiBuilder` handler capabilities (`handle` and `handleRaw`) with deterministic conflict rules.
- FR-11: Convention precedence shall follow router-style ordering:
  - in-file definitions have highest priority,
  - sibling companion files are next,
  - directory-level companions are lowest and compose ancestor-to-leaf.
- FR-12: The plugin shall support security/middleware helper conventions compatible with `HttpApiBuilder` integrations (including `securityDecode` / cookie helper usage paths where configured).
- FR-13: The plugin shall support OpenAPI annotation controls that map directly to Effect `OpenApi.annotations` options: `identifier`, `title`, `version`, `description`, `license`, `summary`, `deprecated`, `externalDocs`, `servers`, `format`, `override`, `exclude`, and `transform`.
- FR-14: The plugin shall generate deterministic source that exports:
  - assembled API definition value(s), and
  - typed builder wiring helpers/layers for handler registration.
- FR-15: Structural type validation shall be driven by `TypeInfoApi` `assignableTo` targets (resolved from program types) for all core contracts; string-based type-name parsing shall not be the primary validation path.
- FR-16: The plugin shall emit stable, typed diagnostics for:
  - invalid id/directory resolution,
  - missing/incompatible exports,
  - ambiguous endpoint or group collisions,
  - unsupported/misplaced convention files.
- FR-17: Type queries used during discovery/validation shall register watch descriptors (`file` / `glob`) so host adapters can invalidate and rebuild affected virtual modules.
- FR-18: If no valid API contract is discovered for the target directory, the plugin shall return explicit unresolved/error outcomes without throwing host-crashing exceptions.
- FR-19: The design shall support optional generated-type checking of emitted source (parallel to router plugin `typeCheck` behavior) when configured.
- FR-20: The plugin pipeline shall parse discovered filesystem artifacts into an explicit tree-based AST (directory/group/endpoint/convention nodes) before source emission.
- FR-21: TypeScript source generation shall consume the AST as its canonical input; direct file-to-string rendering without AST normalization shall be out of contract.
- FR-22: `@typed/vite-plugin` integration shall expose and register the HttpApi virtual-module plugin as a first-class companion to the router VM plugin, including explicit option wiring (`apiVmOptions`) and deterministic plugin registration order.
- FR-23: The plugin shall implement an explicit supported file-role matrix for API roots, groups, endpoints, and companions (with deterministic semantics for each role) and emit diagnostics for unsupported reserved companion names.
- FR-24: The system shall provide a strongly typed handler-construction helper (curried form) so endpoint handlers can be authored as `helper(route, method, request)(function* (ctx) { ... })` with compile-time inference for `params`, `path`, `query`, `body`, headers, success shape, and error shape.
- FR-25: OpenAPI generation and exposure controls shall map to Effect-supported surfaces:
  - spec generation option `additionalProperties` from `OpenApi.fromApi`,
  - JSON spec route exposure equivalent to `HttpApiBuilder.layer({ openapiPath })`,
  - Swagger UI exposure equivalent to `HttpApiSwagger.layer({ path })`,
  - Scalar UI exposure equivalent to `HttpApiScalar.layer({ path, scalar })` and `HttpApiScalar.layerCdn({ path, scalar, version })`.

## Non-Functional Requirements

- NFR-1: All resolution, discovery, validation, and generation operations shall remain synchronous.
- NFR-2: Given unchanged filesystem and program state, output source and diagnostics shall be deterministic.
- NFR-3: Error handling shall be explicit and structured; failures shall not crash Language Service or compiler-host workflows.
- NFR-4: Path handling and ordering shall be cross-platform safe (POSIX/Windows separators and normalization).
- NFR-5: The plugin shall remain first-match compatible with `PluginManager` ordering semantics.
- NFR-6: Structural validation behavior shall be stable and auditable, with explicit fallback/degradation policy when required type targets are unavailable.
- NFR-7: Convention routing shall maintain single-source-of-truth semantics (one canonical convention per concern, explicit conflicts when duplicated).
- NFR-8: Generated surfaces should isolate unstable Effect HttpApi details behind thin generated adapters to reduce downstream churn risk.
- NFR-9: Convenience and type-safety shall be co-optimized; default conventions must minimize boilerplate without weakening structural guarantees.
- NFR-10: AST construction and rendering boundaries shall be explicit and testable so discovery/parsing decisions remain separable from code-emission decisions.

## Acceptance Criteria

- AC-1: (maps to FR-1 / NFR-1, NFR-5) `api:./apis` resolves synchronously through manager integration and either builds or returns deterministic unresolved/error outcomes.
- AC-2: (maps to FR-2, FR-11 / NFR-2, NFR-4) Mixed nested script files are discovered in deterministic order with router-style in-file/sibling/directory precedence.
- AC-3: (maps to FR-4, FR-5 / NFR-7, NFR-9) Directory names map to group names by default, and parenthesized pathless directories avoid creating additional groups while preserving deterministic composition.
- AC-4: (maps to FR-6, FR-7, FR-15 / NFR-6, NFR-9) Endpoint modules missing required route/method/request/response/handler contracts or violating `Schema.TaggedRequest` expectations are rejected with typed diagnostics.
- AC-5: (maps to FR-8 / NFR-9) Endpoint name defaults to filename slug and respects explicit override conventions with deterministic conflict handling.
- AC-6: (maps to FR-9 / NFR-2) Group-level conventions map to deterministic `HttpApiGroup` composition behavior (prefix/error/middleware/annotations) in generated output.
- AC-7: (maps to FR-10 / NFR-2) Endpoint handler conventions map to deterministic `HttpApiBuilder` wiring (`handle`/`handleRaw`) with clear conflict diagnostics.
- AC-8: (maps to FR-12 / NFR-8) Security/middleware helper conventions generate integration points that type-check against expected `HttpApiBuilder` helper contracts.
- AC-9: (maps to FR-13 / NFR-9) OpenAPI controls can be configured from conventions/options without ad-hoc generator edits and with deterministic output metadata.
- AC-10: (maps to FR-14 / NFR-2) Generated module exports both API assembly and handler-layer wiring surfaces with stable naming and deterministic source text.
- AC-11: (maps to FR-16, FR-18 / NFR-3) Invalid contracts, path errors, and collisions produce structured diagnostics and never crash host resolution flow.
- AC-12: (maps to FR-17 / NFR-1) Discovery and validation register watch descriptors so edits in relevant files invalidate and rebuild virtual module outputs.
- AC-13: (maps to FR-19 / NFR-3) Optional generated type-check mode reports deterministic diagnostics/warnings for emitted source without breaking default sync resolution.
- AC-14: (maps to FR-20, FR-21 / NFR-2, NFR-10) Discovery output is normalized into a deterministic tree AST and source emission is derived exclusively from that AST.
- AC-15: (maps to FR-22 / NFR-1, NFR-5) `typedVitePlugin` can register both router and HttpApi VM plugins with explicit options and deterministic ordering, and `api:` modules resolve in Vite integration tests.
- AC-16: (maps to FR-23 / NFR-2, NFR-7) Supported root/group/endpoint/companion filenames are interpreted with deterministic behavior, and unsupported reserved names are rejected with typed diagnostics.
- AC-17: (maps to FR-24 / NFR-6, NFR-9) Handler helper usage infers typed handler context from route + method + `Schema.TaggedRequest`, and compile-time tests fail when handler input/output/error shapes do not match the declared contract.
- AC-18: (maps to FR-13, FR-25 / NFR-2, NFR-9) OpenAPI configuration supports the full Effect-backed option matrix for annotations, schema generation (`additionalProperties`), and exposure modes (json/swagger/scalar) with deterministic behavior and typed diagnostics for invalid combinations.

## Prioritization

- must_have:
  - FR-1, FR-2, FR-4, FR-6, FR-7, FR-11, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25
  - NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-9, NFR-10
  - AC-1, AC-2, AC-3, AC-4, AC-10, AC-11, AC-12, AC-14, AC-15, AC-16, AC-17, AC-18
- should_have:
  - FR-3, FR-5, FR-8, FR-9, FR-10, FR-19
  - NFR-7, NFR-8
  - AC-5, AC-6, AC-7, AC-9, AC-13
- could_have:
  - FR-12
  - AC-8
