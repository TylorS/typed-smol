## Research Questions

1. What TypeScript integration constraints must the router virtual-module plugin honor?
2. Which filesystem-routing conventions are credible for hierarchical composition (layouts/guards/error handling)?
3. What type-safety patterns should be required to maximize compile-time guarantees?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin | 2024 | vendor documentation (TypeScript wiki) | high | Confirms LS plugins are editor-only and not loaded by `tsc`; supports synchronous plugin expectations. |
| https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API | 2023 | vendor documentation (TypeScript wiki) | high | Documents `CompilerHost.resolveModuleNames` and host override model for virtual resolution paths. |
| https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing | 2026 | framework documentation | medium-high | Provides clear filesystem route hierarchy conventions and nested route composition guidance. |
| `.docs/specs/virtual-modules/spec.md` | 2026 | internal canonical spec | high | Establishes synchronous virtual-module contract and deterministic behavior expectations. |
| `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md` | 2026 | internal ADR | high | Confirms architecture decision: synchronous core + adapters + deterministic resolution. |
| `packages/router/src/Matcher.ts` | 2026 | code evidence | high | Shows actual layering/composition semantics (layers/layouts/catches/prefixes) that plugin output must align with. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `TypeScript language service plugin synchronous host callbacks virtual module resolution` | Validate sync and integration constraints. | TypeScript LS plugin wiki, TypeScript LS API wiki |
| `file-based routing hierarchical layouts guards error boundaries framework design` | Validate hierarchy conventions used in modern routing systems. | TanStack file-based routing docs |
| `type-safe file system routing TypeScript readonly const assertions patterns` | Gather type-safety patterns supporting `as const` usage. | TanStack docs (primary); supplementary community examples reviewed as low-confidence context |

## Key Findings

1. The plugin should remain synchronous and avoid async hooks in runtime resolution paths.
2. Filesystem routing conventions should be deterministic and hierarchy-aware, with explicit composition behavior.
3. Route composition should mirror `Matcher` internals: accumulated dependencies, layouts, catches, and prefixes.
4. The leaf route contract should keep `route` explicit while requiring exactly one entrypoint (`handler | template | default`).
5. Type-safety requirements should enforce readonly tuples/records and predictable normalization order.

## Open Risks and Unknowns

- Guard combination semantics need an explicit decision (AND compose vs override).
- Route path authority needs a policy (filesystem-derived vs exported `route` authoritative).
- Catch/layout precedence needs explicit rule for ancestor/leaf conflicts.
- Potential ergonomics trade-off between strict validation and migration convenience for existing route modules.

## Implications for Requirements and Specification

- Requirements should define deterministic discovery/merge order for optional companion files.
- Requirements should encode one-of entrypoint validation (`handler|template|default`) as both FR and AC.
- Specification should include normalization algorithm details:
  - directory traversal order,
  - companion file merge precedence,
  - final emitted `Matcher` construction order.
- Specification should include typed diagnostics for invalid module shapes and ambiguous entrypoint exports.

## Alignment Notes

- specs_alignment:
  - aligned with `.docs/specs/virtual-modules/spec.md` synchronous and deterministic constraints.
- adrs_alignment:
  - aligned with `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md` core/adapter split.
- workflows_alignment:
  - extends `.docs/workflows/20260221-1705-router-virtual-module-brainstorm/01-brainstorming.md` with evidence-backed constraints.

## Memory Promotion Candidates

- procedural (confidence: high):
  - For TS virtual-module features, explicitly separate editor-plugin constraints from compiler-host constraints when drafting requirements.
- heuristics (confidence: medium-high):
  - Define filesystem composition order before API naming to reduce ambiguity in FR/AC drafting.
- mistakes (confidence: medium):
  - Avoid mixing low-confidence community examples with canonical constraints without labeling confidence and scope.
