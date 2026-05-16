# Scope — Typed Framework Evolution

Status: draft, not approved.

## In Scope

### Compiler Substrate

- Productionize the virtual module compiler as a shared generated-artifact system.
- Make disk materialization the default behavior for generated virtual module surfaces.
- Define cache identity, artifact paths, invalidation, cleanup, diagnostics, and watcher semantics.
- Align Vite, vmc, TS plugin, and VS Code behavior around one generated artifact contract.
- Avoid duplicated concurrent recomputation across virtual module surfaces where a shared artifact can be reused safely.

### Framework Core

- Productionize `@typed/app` router virtual modules.
- Productionize `@typed/app` HTTP API virtual modules and related HTTP plugin behavior.
- Preserve the invariant that app virtual module plugins are always registered by `createTypedViteResolver`.
- Update durable specs and ADRs when compiler identity or framework contracts change.

### First-Party Framework Plugins

- Add an Environment plugin for type-safe env vars and `.env` file support.
- Add a type-config plugin that re-exposes Typed configuration files through virtual module surfaces.
- Ensure new app plugins participate in the shared compiler artifact layer.

### Starter Experience

- Create an `@typed/app` create template.
- Include router, HTTP API, env, config, test, lint, format, and Vite integration defaults when the framework baseline is stable enough.

## Out of Scope For Phase 1 Planning

- Immediate implementation changes.
- Publishing packages.
- Full adapter ecosystem design.
- Authentication, database, deployment adapters, or hosting-specific integrations unless needed for template shape.
- Replacing Vite itself.
- Large UI/component framework work outside the minimal app template.

## Likely Workstreams

1. Virtual module artifact contract and compiler productionization.
2. Cross-surface integration parity: Vite, vmc, TS plugin, VS Code.
3. Router and HTTP API framework hardening.
4. Environment and type-config plugins.
5. Create-app template and documentation.

## Sequencing Decision

- Workstreams 1 and 2 are the first implementation tranche.
- Workstreams 3 through 5 remain in research/requirements/specification until the compiler substrate contract is stable enough that higher-level app plugins will not need core interface churn.

## Identity Decision

- `typed-virtual://` remains the portable logical identity for virtual modules.
- Disk-backed generated files are the shared materialized artifact layer behind that identity.
- The default physical root for materialized virtual modules is `node_modules/.typed/virtual`.
- A manifest/cache protocol is required in the first compiler-substrate tranche.
- Cache validity uses source hashes plus relevant config, plugin, and compiler inputs; timestamp/watch invalidation is supporting evidence, not the correctness boundary.
- Concurrent artifact writes use atomic writes with last-valid-writer-wins semantics for v1.
- Generated artifacts are persistent cache entries by default; normal tooling does not eagerly prune them.
- Requirements must define how the logical identity maps to physical paths, manifests, cache keys, diagnostics, cleanup, invalidation, and cross-process reuse.

## Phase 1 Deliverables

- Approved `intent.md`.
- Approved `scope.md`.
- Explicit decision on subagent usage for later research/planning stages: use subagents for large tasks and broad multi-stream work.
- A short list of high-priority unknowns to carry into strict-mode research.

## Subagent Routing

- Broad codebase research, requirements extraction, specification drafting, and multi-stream planning should use parallel specialists by default.
- Direct execution remains acceptable for narrow artifact edits, synthesis, and single-file checks.
- Handoffs must stay concise and include objective, completed work, findings/evidence, risks/open questions, and recommended next action.

## Approval Rule

These documents are drafts until the human explicitly approves them. After approval, commit the Phase 1 artifacts and continue to Phase 2.
