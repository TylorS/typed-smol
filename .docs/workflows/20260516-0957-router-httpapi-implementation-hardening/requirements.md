# Requirements — Router and HttpApi Implementation Hardening

Status: approved.

## Functional Requirements

- FR-1: The hardening tranche must target the Router and HttpApi virtual-module plugin implementations in `@typed/app`, using tests as proof for implementation behavior rather than treating coverage expansion as the deliverable.
- FR-2: Router generated source must be deterministic, type-checking, and semantically aligned with `@typed/router` matcher behavior for route ordering, imports, entrypoint normalization, and guard/dependency/layout/catch composition.
- FR-3: HttpApi generated source must be deterministic, type-checking, and semantically aligned with the installed `packages/app` Effect dependency declarations (`effect@4.0.0-beta.66`) for `HttpApi`, `HttpApiGroup`, `HttpApiEndpoint`, `HttpApiBuilder`, `HttpApiClient`, `HttpApiSwagger`, `HttpApiScalar`, and `OpenApi`.
- FR-4: Durable HttpApi spec items that are not supported by the installed Effect declarations must be treated as spec-update/defer candidates, not implemented through casts or guessed API shapes.
- FR-5: HttpApi source generation must include a convention-to-rendering parity contract: each parsed convention is either emitted, rejected with a structured diagnostic, or explicitly deferred in requirements/specification.
- FR-6: Generated-source proof must include fixture-level type-checking of emitted virtual modules for high-risk Router and HttpApi scenarios, not only inline source snapshots.
- FR-7: Plugin failures for invalid source-tree contracts must return structured diagnostics through the virtual-module build result instead of host-crashing exceptions.
- FR-8: OpenAPI exposure generation must map only to installed Effect-supported APIs unless a later approved requirement changes the dependency target.
- FR-9: HttpApi files that look reserved but do not match a supported convention must be treated as ordinary non-participating files, not hard errors, unless they collide with or shadow a supported convention.
- FR-10: OpenAPI behavior is essential in this tranche: generated HttpApi source must support installed Effect-backed OpenAPI annotations and exposure controls for API, group, and endpoint scopes where the installed API surface supports them.
- FR-11: The canonical first proof harness for generated-source correctness must live in `packages/app` Vitest fixtures and directly type-check emitted virtual module source.

## Non-Functional Requirements

- NFR-1: Generated output must be stable for unchanged filesystem and TypeInfo inputs.
- NFR-2: Error behavior must be fail-clear: diagnostics include stable codes, actionable messages, and relevant source paths where applicable.
- NFR-3: Implementation changes must keep parse, normalize, validate, and render responsibilities explicit enough for focused red-green testing.
- NFR-4: The solution must avoid broad framework feature work outside Router and HttpApi implementation hardening.
- NFR-5: Effect unstable API usage must be isolated behind generated-source emitter boundaries where practical so future API drift is localized.
- NFR-6: Verification must distinguish current package source compilation from generated fixture compilation; both matter but prove different claims.

## Acceptance Criteria

- AC-1: (maps to FR-1, FR-2, NFR-1) Router hardening includes generated-source tests that prove deterministic source and type-checking for representative route trees and entrypoint kinds.
- AC-2: (maps to FR-1, FR-3, FR-4, FR-8, NFR-5) HttpApi hardening includes generated-source tests that type-check against installed `effect@4.0.0-beta.66` declarations and reject/defer unsupported API assumptions.
- AC-3: (maps to FR-5, NFR-3) A convention-to-rendering parity matrix exists for HttpApi and every supported parsed role has an approved emitted, diagnostic, or deferred behavior.
- AC-4: (maps to FR-6, NFR-6) At least one verification path compiles emitted virtual module source in a fixture program rather than only checking source strings.
- AC-5: (maps to FR-7, FR-9, NFR-2) Invalid plugin contracts that are reachable from participating Router/HttpApi source files return structured diagnostics and do not throw internal renderer errors; unrelated reserved-looking files do not block generation.
- AC-6: (maps to FR-8, NFR-5) OpenAPI exposure output uses installed APIs (`HttpApiBuilder.layer`, `HttpApiSwagger.layer`, `HttpApiScalar.layer` / `layerCdn`, `OpenApi.fromApi`) without unsupported options.
- AC-7: (maps to FR-10, NFR-5) OpenAPI annotations and exposure controls are represented in generated source through installed Effect-supported APIs, with unsupported/stale config keys producing explicit diagnostics or documented deferrals.
- AC-8: (maps to FR-6, FR-11, NFR-6) Generated-source fixtures in `packages/app` compile emitted Router and HttpApi virtual modules directly; sample-project coverage is deferred unless integration proof requires it.

## Prioritization

- must_have:
  - FR-1 through FR-9
  - FR-10
  - FR-11
  - NFR-1 through NFR-6
  - AC-1 through AC-8
- should_have:
  - none yet
- could_have:
  - none yet

## Decisions

- The installed `packages/app` Effect dependency declarations (`effect@4.0.0-beta.66`) are the source of truth for generated HttpApi source in this tranche.
- Older durable spec references to unsupported Effect APIs, including `OpenApi.fromApi({ additionalProperties })`, are spec-update/defer candidates rather than implementation requirements.
- Unsupported reserved-looking HttpApi files are ordinary non-participating files unless they collide with or shadow a supported convention.
- OpenAPI is essential in this tranche; do not limit the work to exposure paths only.
- `packages/app` Vitest fixtures are the canonical first proof harness for emitted-source type-checking.

## Open Questions

- None.
