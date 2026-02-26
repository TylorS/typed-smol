## Research Questions

1. Which `effect/unstable/httpapi` composition semantics must an `api:` virtual-module generator respect?
2. How should filesystem conventions map to `HttpApi` / `HttpApiGroup` / endpoint handler wiring while staying deterministic?
3. What constraints from the existing virtual-modules architecture and router plugin must carry over?
4. Which validation approach best preserves type safety for generated API assembly?

## Source Table

| source                                                                                 | year | type                    | confidence  | notes                                                                                                                          |
| -------------------------------------------------------------------------------------- | ---- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html                     | 2026 | official API docs       | high        | Confirms `HttpApiBuilder.api`, `group`, middleware/security APIs, and handler validation contract (`Handlers.ValidateReturn`). |
| https://effect-ts.github.io/effect/platform/HttpApiGroup.ts.html                       | 2026 | official API docs       | high        | Confirms group model (`make`, `add`, `prefix`, `middleware`) and group-level semantics.                                        |
| https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API                    | 2026 | official vendor docs    | high        | Reinforces compiler-host and module-resolution customization constraints relevant to virtual modules.                          |
| https://learn.openapis.org/best-practices.html                                         | 2026 | standards guidance      | medium-high | Supports design-first and single-source-of-truth documentation practices for API contracts.                                    |
| `.docs/specs/virtual-modules/spec.md`                                                  | 2026 | internal canonical spec | high        | Defines synchronous plugin contract, deterministic behavior, and TypeInfoApi query model.                                      |
| `.docs/specs/router-virtual-module-plugin/spec.md`                                     | 2026 | internal canonical spec | high        | Provides existing discovery/validation/composition/generation blueprint to adapt for `api:`.                                   |
| `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`                    | 2026 | internal ADR            | high        | Locks sync core + loader behavior and non-crashing result model.                                                               |
| `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md` | 2026 | internal ADR            | high        | Establishes proven convention-driven discovery and composition decision pattern.                                               |
| `packages/app/src/RouterVirtualModulePlugin.ts` + internal helpers                     | 2026 | code evidence           | high        | Shows exact plugin structure, diagnostic flow, and ordering assumptions to mirror.                                             |
| `packages/virtual-modules/src/TypeInfoApi.ts`                                          | 2026 | code evidence           | high        | Confirms structural assignability via `typeTargets` -> `assignableTo`.                                                         |

## WebSearch Query Log

| query                                                                  | rationale                                                                                | selected_sources                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `effect unstable httpapi HttpApiBuilder group layer documentation`     | Find primary HttpApi composition docs and signatures.                                    | Effect docs pages for `HttpApiBuilder.ts` and `HttpApiGroup.ts`.                                                    |
| `TypeScript resolveModuleNameLiterals compiler host documentation`     | Validate host-level resolution constraints and compatibility expectations.               | TS compiler API wiki + module resolver references.                                                                  |
| `file based API routing conventions research paper 2024 2025`          | Seek recent external evidence on filesystem API conventions.                             | TanStack docs and ecosystem implementations (no strong peer-reviewed results returned).                             |
| `OpenAPI filesystem conventions API grouping endpoints best practices` | Gather durable API organization guidance.                                                | OpenAPI best-practices and tagging/grouping guidance.                                                               |
| `static analysis file-based routing TypeScript research paper`         | Check for formal research relevant to convention extraction.                             | One adjacent TypeScript routing paper; treated as low direct applicability.                                         |
| `API endpoint extraction from source code research paper`              | Identify research on endpoint discovery/contract extraction.                             | Static-analysis endpoint extraction papers; useful background but low direct applicability to this plugin contract. |
| `deterministic code generation incremental build systems research`     | Validate determinism/incremental-build principles that map to virtual module generation. | Incremental-build research and build-system design papers.                                                          |

## Key Findings

1. `HttpApi` composition is explicitly group-oriented, not matcher-oriented:
   - Groups are first-class and meant to be implemented through `HttpApiBuilder.group(...)`.
2. Handler completeness can be type-driven:
   - `HttpApiBuilder.Handlers.ValidateReturn` indicates unimplemented endpoints at type level.
3. Group-level concerns are explicit in HttpApi APIs:
   - Group APIs include `prefix`, `middleware`, and shared `addError`, which are strong candidates for filesystem companion conventions.
4. Existing virtual-module constraints remain non-negotiable:
   - sync `shouldResolve`/`build`, deterministic ordering, typed diagnostics, and non-crashing outcomes.
5. Structural type checking is required for correctness:
   - `TypeInfoApi` already provides `assignableTo` via pre-resolved type targets; this pattern should be reused for `HttpApi` concepts.
6. Current repo has no concrete HttpApi usage fixtures:
   - design must include explicit unknown handling and a phased rollout strategy.

## Open Risks and Unknowns

- Exact set of type targets needed for `HttpApi` plugin structural checks (`HttpApi`, `HttpApiGroup`, endpoint types, builder handler types).
- Best balance between convention-only discovery and explicit override files for complex group metadata.
- Ambiguity policy for duplicate endpoint names/path-method collisions across files.
- Migration ergonomics for users who want minimal boilerplate vs strict explicitness.

## Implications for Requirements and Specification

- Requirements should define:
  - `api:` ID parsing and path resolution behavior equivalent to router plugin guarantees.
  - core file contract and companion convention contract separately.
  - deterministic composition and collision/error semantics with explicit diagnostic IDs.
- Specification should include:
  - a component for `resolveApiTypeTargets` (parallel to `resolveRouterTypeTargets`).
  - generation model that emits both API assembly and handler-layer wiring.
  - failure-mode matrix for missing contracts, incompatible types, and ambiguous discovery.
  - testing strategy centered on critical-path scenarios for deterministic output and structural validation.

## Alignment Notes

- specs_alignment:
  - aligns with `.docs/specs/virtual-modules/spec.md` sync/deterministic architecture.
  - aligns with `.docs/specs/router-virtual-module-plugin/spec.md` plugin decomposition pattern.
- adrs_alignment:
  - aligns with existing virtual-modules and router-convention ADR decisions; no conflict discovered.
- workflows_alignment:
  - reuses lessons from prior router brainstorm/research but avoids carrying forward superseded route-file assumptions.

## Memory Promotion Candidates

- procedural (confidence: high):
  - For Effect-facing virtual modules, always map filesystem conventions onto the owning builder/composition API model before defining file names.
- heuristics (confidence: medium-high):
  - Use optional override files for advanced metadata while preserving deterministic convention defaults.
- mistakes (confidence: medium):
  - Do not infer unstable module semantics from naming alone; pin behavior to current official API docs and isolate generated integration behind adapters.
- benchmarks (confidence: low):
  - No measured implementation benchmark yet; defer promotion until prototype and tests exist.
