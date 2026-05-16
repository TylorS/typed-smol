## Research Questions

1. Which generated-source behaviors are highest risk for Router and HttpApi implementation hardening?
2. Does the current HttpApi emitter match the installed Effect HttpApi API surface in `packages/app/node_modules/effect@4.0.0-beta.66`?
3. Which invalid-input paths should become hard build diagnostics instead of warnings or internal throws?
4. What proof shape is needed before requirements can claim generated-source correctness?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| `.docs/specs/router-virtual-module-plugin/spec.md` | 2026 | durable repo spec | high | Defines Router plugin steady-state behavior: deterministic source, structured diagnostics, route/concern composition, TypeInfo classification. |
| `.docs/specs/router-virtual-module-plugin/requirements.md` | 2026 | durable repo requirements | high | Defines Router FR/NFR/AC including deterministic order, non-crashing errors, and generation-time runtime-kind classification. |
| `.docs/specs/httpapi-virtual-module-plugin/spec.md` | 2026 | durable repo spec | high | Defines HttpApi AST-first parse/render boundary, Effect-backed OpenAPI controls, convention matrix, and generated API/builder surfaces. |
| `.docs/specs/httpapi-virtual-module-plugin/requirements.md` | 2026 | durable repo requirements | high | Defines HttpApi FR/NFR/AC including deterministic AST rendering, structured diagnostics, type targets, OpenAPI, and Vite registration. |
| `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md` | 2026 | durable repo testing strategy | high | Defines critical generated-source and type-check scenarios; useful as evidence shape, not implementation scope by itself. |
| `packages/app/src/RouterVirtualModulePlugin.ts` and `packages/app/src/internal/*Router*` | 2026 | current source | high | Current Router build path validates descriptors and emits source through a descriptor tree; renderer still has internal invariant throws. |
| `packages/app/src/HttpApiVirtualModulePlugin.ts` and `packages/app/src/internal/*httpapi*` | 2026 | current source | high | Current HttpApi build path builds descriptor tree, validates endpoint contracts/prefixes, extracts OpenAPI exposure, and emits source; some diagnostics are warnings and some convention metadata is not yet emitted. |
| `packages/app/node_modules/effect/dist/unstable/httpapi/*.d.ts` | 2026 | installed dependency declarations | high | Installed API is `effect@4.0.0-beta.66`; generated source must type-check against this exact local surface. |
| `.cursor/skills/effect-module-unstable-httpapi/SKILL.md` and HttpApi facet skills | 2026 | local Effect guidance | medium-high | Confirms unstable HttpApi usage should be isolated behind thin generated adapters and checked against owning facets. |
| [Effect HttpApiBuilder official docs](https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html) | 2026 | official generated docs | medium | Official docs are useful for current broad API shape, but local installed declarations remain the source of truth for this repo. |
| [Effect OpenApi official docs](https://effect-ts.github.io/effect/platform/OpenApi.ts.html) | 2026 | official generated docs | medium | Confirms official OpenApi surface and annotations, but local installed declarations are more precise for implementation. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `Effect HttpApiBuilder HttpApiEndpoint HttpApiGroup OpenApi official docs Effect TypeScript` | Find primary current docs for Effect HttpApi generated-source compatibility. | Effect HttpApiBuilder official docs; Effect OpenApi official docs. |
| `Effect documentation HttpApiBuilder layer group handle handleRaw OpenApi fromApi` | Verify builder layer/group/handler and OpenAPI entrypoints in official docs. | Effect HttpApiBuilder official docs. |
| `Effect TypeScript HttpApi official docs OpenApi Scalar Swagger` | Check Swagger/Scalar/OpenAPI exposure API shape. | Effect docs and local installed declarations; no secondary source needed. |

## Key Findings

### Generated Source Is the Right Primary Risk Axis

The current tests snapshot emitted source, but the most important production claim is stronger: generated source should type-check and preserve semantics against the installed dependencies. Existing snapshot tests prove deterministic strings for many cases, but requirements should demand generated-source type-check fixtures for high-risk Router and HttpApi outputs.

### HttpApi Emitter Must Be Checked Against `effect@4.0.0-beta.66`

Installed declarations show:

- `HttpApiBuilder.layer(api, { openapiPath? })` returns a router-registration layer.
- `HttpApiBuilder.group(api, groupName, build)` requires all endpoints in the group to be handled; the return type reports unhandled endpoint names.
- `handlers.handle(name, handler)` passes a typed request with `params`, `query`, optional `payload`, optional `headers`, request metadata, endpoint, and group.
- `handlers.handleRaw(name, handler)` passes raw request context without automatic payload decoding.
- `HttpApiEndpoint` constructors accept `params`, `query`, `headers`, `payload`, `success`, and `error`; the current emitter maps local `body` export to Effect's `payload` option.
- `HttpApiGroup.make(name).add(...endpoints).prefix(prefix)` applies prefixes only to endpoints already added.
- `OpenApi.fromApi(api)` in the installed declaration does not accept `additionalProperties`, even though the older durable spec references `OpenApi.fromApi` generation controls.
- `HttpApiScalar.layer` and `HttpApiScalar.layerCdn` both exist; the current emitter only emits `layer`, so CDN exposure needs explicit hardening if it remains in scope.

Implication: requirements must include generated-source type-check gates against the installed Effect declarations before claiming HttpApi hardening. The durable OpenAPI generation-control requirement is stale or incomplete for the installed package and must be reconciled in requirements/specification.

### HttpApi Convention Metadata Is Partially Parsed But Not Fully Rendered

The current HttpApi descriptor tree records API root, group override, directory companions, endpoint companions, pathless directories, and unsupported reserved roles. The emitter uses some of this data for groups, prefixes, root middlewares, OpenAPI exposure, and endpoint optional exports. It does not yet appear to fully render:

- endpoint-level prefix from `byEndpoint`;
- group name override from `_group.ts` name;
- endpoint name override from in-file or `.name.ts`;
- endpoint/group/API annotations via `OpenApi.annotations`;
- endpoint/group dependencies and middlewares beyond root `_middlewares.ts`;
- Scalar CDN mode or Scalar `config`;
- hard diagnostics for unsupported reserved convention files.

Implication: requirements should not only say "type-check generated source"; they should require a convention-to-rendering parity matrix so every parsed convention is either emitted, diagnosed, or explicitly deferred.

### Warning-Only Unsupported Roles Conflict With Production Hardening

`httpapiDescriptorTree` collects unsupported reserved roles as diagnostics, but `HttpApiVirtualModulePlugin.build` currently returns `sourceText` plus warnings when the tree has diagnostics. The durable requirements include diagnostics for unsupported/misplaced convention files and explicit non-crashing errors. For production hardening, unsupported reserved names should likely be build errors unless the human chooses migration leniency.

Implication: Phase 2 must ask for approval on "hard error" vs "warning with source" behavior for unsupported reserved HttpApi roles.

### Router Is Closer But Still Needs Fail-Closed Audit

Router already uses descriptor construction, structured violations, and a descriptor-tree renderer. Remaining research risks:

- `renderRouterDescriptorTree` throws if internal validation misses catch/dependency metadata or tries to render an empty directory node.
- Directory companion order is currently rendered closest-first for layouts/dependencies in tests, while the durable spec phrases some composition as ancestor-to-leaf or outer-to-inner. Requirements must state the desired observable ordering precisely.
- Golden tests cover source snapshots; generated-source type-check and behavior-level fixtures would make the production claim stronger.

Implication: Router work should focus on generated-source proof and internal invariant-to-diagnostic conversion where invalid user input can trigger renderer throws.

### Current Baselines

- `pnpm --filter @typed/app test`: passed before research artifact creation: 9 test files, 205 tests, no type errors.
- `pnpm --filter @typed/app build`: passed against current package source.

These prove the package currently compiles and the existing tests pass, but they do not prove generated HttpApi source type-checks in real fixture programs.

## Open Risks and Unknowns

- Whether the durable HttpApi OpenAPI generation requirement around `additionalProperties` should be removed, deferred, or remapped to the installed package API.
- Whether unsupported reserved HttpApi roles should be hard errors immediately or warnings for one compatibility release.
- Whether generated-source type-check fixtures should live inside `packages/app` tests, a sample project, or a reusable virtual-module compiler harness.
- Whether Router directory companion ordering in existing tests is the intended semantic contract or a historical implementation artifact.
- Whether the current generated `App` / `serve` layer types are correct for all planned user extension layers, not only current snapshots.

## Implications for Requirements and Specification

- Requirements must prioritize generated-source type-check fixtures for Router and HttpApi.
- Requirements must include a convention-rendering parity matrix for HttpApi.
- Requirements must explicitly decide hard-error vs warning behavior for unsupported reserved roles.
- Requirements must reconcile durable OpenAPI generation controls with the installed Effect declarations.
- Specification should isolate Effect unstable HttpApi calls behind a small emitter helper boundary so future API drift is localized.
- Planning should split Router and HttpApi tasks, with HttpApi generated-source compatibility first.

## Alignment Notes

- specs_alignment:
  - Router findings align with existing spec goals for deterministic output, structured diagnostics, and generation-time normalization.
  - HttpApi findings align with existing AST-first and deterministic generation goals, but the OpenAPI generation-control surface may be stale against installed Effect.
- adrs_alignment:
  - No relevant ADRs were found during this research pass.
- workflows_alignment:
  - Aligns with the approved Phase 1 intent/scope for a full production pass with heavy generated-source focus.
  - Continues the previous framework-evolution sequencing: higher-level app plugin hardening follows the shared artifact-store tranche.

## Memory Promotion Candidates

- procedural: For future `@typed/app` HttpApi work, treat installed `packages/app/node_modules/effect/dist/unstable/httpapi/*.d.ts` as the source of truth over older durable docs or online docs.
- heuristic: Generated-source correctness should be proven by type-checking emitted fixture modules, not only by snapshotting emitted strings.
- mistake: Do not let unsupported reserved HttpApi convention files remain warnings by default if the plugin is claiming production-ready fail-clear behavior.
