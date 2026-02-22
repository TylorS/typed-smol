## Scope

- in_scope:
  - Resolve `router:./<directory>` virtual module IDs into deterministic matcher assembly modules.
  - Discover route candidates from regular `*.ts` files using type-aware export validation (no `*.route.ts` naming requirement).
  - Use TypeInfoApi to validate `route` and classify `handler|template|default` into `Fx`, `Effect`, `Stream`, or plain value for optimized generation.
  - Compose optional guard/dependencies/layout/catch concerns hierarchically.
- out_of_scope:
  - Async plugin hooks or async type inspection.
  - Runtime-only export classification that bypasses generation-time normalization.

## Functional Requirements

- FR-1: The plugin shall resolve module IDs in the form `router:./<directory>` relative to the importer path and produce a virtual module result through the existing synchronous `@typed/virtual-modules` plugin contract.
- FR-2: The plugin shall discover candidate leaf modules by scanning regular `*.ts` files under the target directory and validating that they export a `route` declaration compatible with `Route.Any`.
- FR-3: Each valid leaf route module shall export exactly one of `handler`, `template`, or `default`; invalid entrypoint combinations shall be rejected with structured diagnostics.
- FR-4: The plugin shall support sibling optional companion modules for each leaf route basename: `*.guard.ts`, `*.dependencies.ts`, `*.layout.ts`, and `*.catch.ts`.
- FR-5: The plugin shall support directory-level hierarchical optionals: `_guard.ts`, `_dependencies.ts`, `_layout.ts`, and `_catch.ts`.
- FR-6: The plugin shall compose hierarchy from ancestor to leaf using deterministic semantics:
  - guards compose as logical-AND (first failure blocks route),
  - dependencies compose by ordered concatenation,
  - layouts compose outer-to-inner,
  - catches compose outer-to-inner.
- FR-7: The plugin shall normalize `template` and `default` exports into the same runtime handler shape expected by router matcher generation.
- FR-8: The plugin shall generate a deterministic route assembly output that is equivalent in behavior to constructing `Matcher.match(...)` entries with corresponding options (`guard`, `dependencies`, `layout`, `catch`) for each leaf.
- FR-9: The plugin shall emit typed diagnostics for contract errors, including missing/incompatible `route` type, invalid one-of entrypoint selection, invalid optional module shape, and duplicate/ambiguous route definitions.
- FR-10: The plugin shall expose readonly route descriptor structures (`as const` compatible) for generated metadata so consumers can retain maximal literal type inference.
- FR-11: The plugin shall support deterministic route ordering across platforms via normalized path handling and stable sort rules.
- FR-12: If no valid route leaf is discovered under the resolved directory, the plugin shall return an explicit unresolved outcome (no throw) for host fallback behavior.
- FR-13: The plugin shall use TypeInfoApi synchronously to classify each leaf entrypoint export as `Fx`, `Effect`, `Stream`, or plain value and drive generation strategy from that classification.
- FR-14: For plain-value entrypoints, the plugin shall generate code that lifts values into `Fx` during code generation so runtime classification/wrapping is not required.

## Non-Functional Requirements

- NFR-1: All plugin operations (resolution, discovery, validation, generation) shall remain synchronous.
- NFR-2: File discovery and composition outputs shall be deterministic for the same filesystem state and importer input.
- NFR-3: Error behavior shall be explicit and typed; plugin failures shall not crash host resolution flows.
- NFR-4: The generated virtual source shall be stable enough for incremental editor workflows (minimal churn when unchanged inputs are re-read).
- NFR-5: Path handling shall be cross-platform safe (POSIX/Windows separators, case-handling delegated to host policy where applicable).
- NFR-6: The design shall remain compatible with the existing `@typed/virtual-modules` manager first-match plugin semantics.
- NFR-7: Discovery/validation should avoid unnecessary repeated parsing within a single resolve/build call.
- NFR-8: Publicly documented conventions shall use a single canonical naming scheme for companion files to prevent ambiguity.
- NFR-9: TypeInfoApi-based validations and classifications shall be deterministic and treated as explicit contract failures when unresolved or incompatible, never as host-crashing exceptions.

## Acceptance Criteria

- AC-1: (maps to FR-1, NFR-1, NFR-6) Given `id = "router:./routes"` and an importer file, plugin resolution succeeds synchronously and returns a virtual module result through the core manager contract.
- AC-2: (maps to FR-2, FR-11, NFR-2, NFR-9) Given multiple regular `*.ts` files in nested folders, only files with TypeInfoApi-validated `route: Route.Any` are treated as leaves and ordered deterministically.
- AC-3: (maps to FR-3, FR-9, FR-13, NFR-3, NFR-9) Given a candidate file exporting both `handler` and `template`, or a non-assignable `route`, the plugin returns a structured validation error instead of throwing.
- AC-4: (maps to FR-4, FR-5, FR-6) Given ancestor and leaf optional modules, composition follows ancestor-to-leaf ordering for guard/dependencies/layout/catch exactly as specified.
- AC-5: (maps to FR-7, FR-8, FR-13, FR-14) Given one leaf with plain-value `template` and another with `default` as `Effect`, generated output pre-lifts the plain value into `Fx` and both entries behave as normalized matcher handlers.
- AC-6: (maps to FR-8, FR-11, NFR-4) Rebuilding without filesystem changes yields semantically identical route assembly output.
- AC-7: (maps to FR-9, NFR-3) Diagnostics include file path + contract rule ID for invalid module shape errors.
- AC-8: (maps to FR-10) Generated route descriptor metadata is readonly/literal-preserving and usable with `as const` inference expectations in TypeScript.
- AC-9: (maps to FR-12, NFR-3) With an empty or invalid route directory, plugin returns unresolved (or structured invalid result) without host crash.
- AC-10: (maps to NFR-5) Path normalization tests pass on mixed separator inputs and maintain deterministic ordering.
- AC-11: (maps to FR-13, NFR-9) Given files exporting `handler` as each of `Fx`, `Effect`, `Stream`, and plain value, TypeInfoApi classification is deterministic and generation selects the matching code path for each.

## Prioritization

- must_have:
  - FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-11, FR-12, FR-13, FR-14
  - NFR-1, NFR-2, NFR-3, NFR-5, NFR-6, NFR-8, NFR-9
  - AC-1, AC-2, AC-3, AC-4, AC-5, AC-7, AC-9, AC-10, AC-11
- should_have:
  - FR-10
  - NFR-4, NFR-7
  - AC-6, AC-8
- could_have:
  - Alternate companion naming aliases for migration support (only if they do not weaken deterministic resolution).
