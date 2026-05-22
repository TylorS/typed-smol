## Problem Statement

Typed needs to evolve from a collection of strong libraries into a coherent framework. The framework should keep Typed's modular compiler advantage, but provide a more opinionated app experience: router, HTTP APIs, typed environment/config surfaces, and a first-class create-app path.

The central substrate problem is that virtual modules are not yet a single shared generated-artifact system. Vite, vmc, TS plugin, and VS Code can each resolve or materialize generated modules independently. Current docs and code also disagree: the durable virtual-modules spec still describes `typed-virtual://` in-memory files as canonical, while current implementation paths already prefer `node_modules/.typed/virtual` when a project root exists.

## Desired Outcomes

- Make the virtual module compiler production-grade and disk-backed by default.
- Define a canonical generated-artifact contract shared by Vite, vmc, TS plugin, and VS Code.
- Harden `@typed/app` router and HTTP API virtual module surfaces enough for framework use.
- Add first-party Environment and type-config plugins.
- Add an easy create-app/template path with router, HTTP API, env/config, tests, lint, format, and zero manual Vite setup.

## Constraints and Assumptions

- Strict mode is active: brainstorming, research, requirements, specification, planning, execution, finalization.
- Finalization strategy is PR.
- The human approved subagent use for large tasks and broad multi-stream research/planning.
- `createTypedViteResolver` must keep all app virtual module plugins always enabled.
- Existing workflows are reference-only unless explicitly reused.
- Phase 1 does not change implementation code.
- Effect-related HTTP API claims must be checked against Effect ownership/docs during later research/spec stages.

## Known Unknowns and Risks

- **Artifact identity:** The current key is importer plus id, hashed into a path. It does not include plugin/config/compiler identity or dependency fingerprints.
- **URI vs disk path:** Need to decide whether `typed-virtual://` remains a logical/debug identity over disk artifacts or is replaced by file paths for normal TypeScript program identity.
- **Invalidation:** Current record stores and TypeInfo caches are per-process/session. A disk-backed default needs manifest-backed invalidation or deterministic rebuild-on-read.
- **Concurrency:** Vite, TS server, vmc watch, and VS Code can run simultaneously. Atomic writes and last-writer/file-lock semantics need requirements.
- **Import rewriting:** Existing regex-based relative import rewriting is too narrow for a production artifact layer.
- **vmc watch:** Explorer found likely adapter-lifetime weakness: the adapter is disposed immediately after builder-program creation.
- **HTTP API hardening:** Existing implementation validates core exports and some assignability, but does not prove handler success/error types match schemas and does not fully wire companions.
- **Config drift:** `typed.config.ts` is canonical in specs, but TS plugin still merges `vmc.config.ts`; this needs an explicit compatibility/migration decision.
- **Env safety:** The environment plugin must define public/private boundaries so secrets are not exposed to client bundles.
- **Create-app naming:** `@typed/template` already exists as the HTML template/rendering package, so the app scaffolding surface should avoid overloading "template".

## Candidate Approaches

### A. Compiler Substrate First

Define and implement a shared generated artifact store before hardening router, HTTP API, env, config, or create-app work.

Pros:

- Fixes the foundation before multiplying virtual module surfaces.
- Lets every plugin share the same artifact, invalidation, diagnostics, and VS Code story.
- Aligns with the user's "rock-solid" requirement.

Cons:

- Delays visible framework features.
- Requires an ADR/spec update before most implementation can safely begin.

### B. Parallel Framework Tracks

Run compiler substrate, router/HTTP hardening, env/config plugins, and create-app planning in parallel.

Pros:

- Faster apparent framework progress.
- Can expose cross-cutting requirements earlier.

Cons:

- High risk of building new plugin surfaces against a substrate contract that is about to change.
- Likely creates rework in env/config/create-app generated module surfaces.

### C. Thin Framework MVP First

Ship an opinionated create-app path on top of current Vite/TS plugin behavior, then harden the compiler substrate later.

Pros:

- Produces a demoable framework quickly.
- Useful for product feedback.

Cons:

- Contradicts the stated priority that the virtual module compiler must be productionized first.
- Risks normalizing brittle generated-module behavior.

## Recommendation

Prefer **Approach A with narrow parallel research only**.

The first implementation tranche should make the disk-backed generated-artifact contract a hard prerequisite. Router/HTTP/env/config/create-app work can continue in research and requirements form, but implementation should not add new app virtual module surfaces until the artifact identity, manifest, invalidation, concurrency, diagnostics, and cleanup rules are specified.

This does not mean waiting weeks before thinking about framework features. It means the framework feature requirements should feed into the compiler substrate requirements before code is written.

## Human Decisions

- Compiler substrate comes first so higher-level framework code does not bake in unstable core interfaces.
- Preserve `typed-virtual://` as the portable logical identity; use disk-backed artifacts as the shared materialized backing layer.
- Use `node_modules/.typed/virtual` as the default physical artifact root.
- Include manifest/cache semantics in the first compiler-substrate tranche; write-through materialized files without cache protocol do not satisfy the goal.
- Validate cache reuse from source hashes plus config, plugin, and compiler inputs; timestamps/watch events are insufficient as the correctness boundary.
- Use atomic writes with last-valid-writer-wins semantics for concurrent v1 artifact generation.
- Treat generated artifacts as persistent cache files by default; keep explicit clean/prune as a deliberate tooling action.

## Source Grounding

- consulted_specs:
  - `.docs/specs/virtual-modules/spec.md` — current virtual module contract; stale against disk-path implementation.
  - `.docs/specs/router-virtual-module-plugin/spec.md` — router VM intended behavior.
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md` — HTTP API VM intended behavior and stricter requirements than current implementation.
  - `.docs/specs/typed-config/spec.md` — current typed config contract.
- consulted_adrs:
  - `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md` — accepted synchronous core/loader decision.
- consulted_workflows:
  - `.docs/workflows/20260225-2100-typed-config-unification/03-plan.md` — typed config implementation sequence.
  - `.docs/workflows/20260225-1600-virtual-to-virtual-imports/*` — existing virtual-to-virtual importer chain context.
  - `.docs/workflows/20260221-1600-virtual-modules-vscode/00-plan.md` — VS Code virtual module preview context.
- consulted_code:
  - `packages/virtual-modules/src/internal/path.ts`
  - `packages/virtual-modules/src/internal/VirtualRecordStore.ts`
  - `packages/virtual-modules/src/internal/materializeVirtualFile.ts`
  - `packages/virtual-modules-compiler/src/compile.ts`
  - `packages/virtual-modules-compiler/src/watch.ts`
  - `packages/virtual-modules-vite/src/vitePlugin.ts`
  - `packages/virtual-modules-ts-plugin/src/plugin.ts`
  - `packages/virtual-modules-vscode/src/virtualPreviewDisk.ts`
  - `packages/app/src/RouterVirtualModulePlugin.ts`
  - `packages/app/src/HttpApiVirtualModulePlugin.ts`
  - `packages/app/src/internal/emitHttpApiSource.ts`
  - `packages/app/src/config/TypedConfig.ts`
  - `packages/cli/src/commands/typed.ts`
- consulted_external_sources:
  - Vite Plugin API virtual module convention: `https://vite.dev/guide/api-plugin/`
  - Vite Environment API/plugin docs: `https://vite.dev/guide/api-environment-plugins`
  - Vite env and mode docs: `https://vite.dev/guide/env-and-mode`
  - SvelteKit routing and `$types` docs: `https://svelte.dev/docs/kit/routing`
  - SvelteKit env docs: `https://svelte.dev/docs/kit/$env-static-private`, `https://svelte.dev/docs/kit/$env-dynamic-private`
  - SvelteKit create/project structure docs: `https://svelte.dev/docs/kit/creating-a-project`, `https://svelte.dev/docs/kit/project-structure`

## Initial Memory Strategy

- Capture short-term discoveries inside this workflow during Phase 2 and Phase 3.
- Promote durable rules only after requirements/spec approval.
- Likely promotion candidates:
  - Disk-backed generated virtual module artifact contract.
  - Public/private env module safety rules.
  - `vmc.config.ts` migration/compatibility rule.
  - Framework create-app naming convention.
