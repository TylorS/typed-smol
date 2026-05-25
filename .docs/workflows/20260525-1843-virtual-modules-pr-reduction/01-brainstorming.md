## Problem Statement

The current PR has grown across too many surfaces at once: virtual-module hosts, app runtime generation, compiler/template output, HMR, DevTools, Storybook, RealWorld, VS Code, TS plugin, and generated HttpApi client types. The branch needs to become a reviewable release path with explicit scope boundaries and executable proof.

The human clarified one immediate design correction: `TypedClient` should not exist. Wrapper mappings lose generic function parameters and provide no benefit over the raw Effect `HttpApiClient`-derived client. This supersedes earlier remediation language that allowed a thin `TypedClient` projection.

## Desired Outcomes

- Virtual modules behave consistently across dev mode, build, preview, `vmc`, TypeScript language service, VS Code, and the RealWorld example.
- VS Code and the TS plugin are stable and efficient, sharing generated virtual artifacts and cache invalidation rules instead of maintaining divergent host behavior.
- Storybook is stable and reliable, proving real framework integration instead of static fixture-only confidence.
- Typed, Vite, `vmc`, TypeScript, and VS Code configuration paths are researched for a DRY shared model.
- Type safety is preserved across generated virtual modules, framework helpers, compiler output, and examples.
- Production builds emit only the plugin-generated imports consumed by user code and the dependencies required by those imports.
- The compiler produces truthful facts for module participation, template optimization, DevTools correlation, and HMR eligibility.
- Template compilation has executable proof for optimized server HTML and DOM outputs.
- Stateful HMR preserves state only across proven boundaries and fails closed elsewhere.
- DevTools panels are wired to live runtime/compiler facts end to end and expose unavailable states for unwired capabilities.
- Generated HttpApi client output uses raw `Client` / `HttpApiClient.ForApi` surfaces without `TypedClient` wrappers or generic-erasing mapped functions.
- The PR is reduced or sequenced into reviewable tasks with traceable requirements and acceptance gates.

## Constraints and Assumptions

- Mode is `strict`; finalization strategy is `pr`.
- Existing workflow folders are reference-only for this run.
- Implementation waits for explicit approval of Phase 1 documents, then requirements/spec/plan gates.
- Package ownership follows `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`.
- Compiler boundaries follow `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`.
- Effect API usage is routed through the Effect skill ownership files before technical claims or edits.
- The worktree is dirty and may contain other agent/human changes; do not revert unrelated work.
- Subagents are required for this breadth and have been launched for four read-only research lanes.

## Known Unknowns and Risks

- The current dirty branch may already contain partial fixes that need pruning rather than layering more code.
- RealWorld may pass package-local tests while failing generated-runtime, preview, HMR, or browser acceptance paths.
- DevTools may have fixture-backed confidence that does not prove live inspected-page behavior.
- The compiler package exists and has substantial surface area, but "100% functioning compiler" needs narrow, testable release semantics.
- Template optimization claims need measurable criteria before implementation.
- Removing `TypedClient` may require updating examples, docs, tests, and generated-output snapshots.
- VS Code and TS plugin instability may be symptoms of duplicated cache ownership, hot-path program creation, or divergent artifact materialization.
- Storybook instability may be a sign that it is consuming generated app/runtime/client contracts differently than application builds.
- Config drift between Typed, Vite, `vmc`, TypeScript plugin, and VS Code may be creating duplicated bootstrapping and inconsistent behavior.
- Some plugins may currently emit broad all-exports modules that defeat production tree-shaking or force unrelated type failures into builds.
- Import-pruned production output needs a shared dependency-closure model so each plugin does not invent its own reachability rules.
- "Optimize everything" needs measurable release targets so simplification work does not become speculative churn.

## Candidate Approaches

### Approach A: One Vertical Release Slice

Prove one end-to-end path through generated HttpApi client cleanup, virtual-module host parity, compiler facts, HMR, RealWorld dev/build/preview, and live DevTools. This gives the strongest product confidence but requires strict sequencing and may still be too broad for one PR.

### Approach B: Split By Ownership Area

Carve separate PRs for generated client cleanup, virtual-module host parity, compiler/HMR/template output, and DevTools liveness. This reduces review risk but delays proving the full product path and may leave integration gaps between PRs.

### Approach C: Stabilize Current PR With Hard Red Lines

Keep the current PR as the integration branch, delete misleading surfaces such as `TypedClient`, add acceptance gates, and defer only clearly independent polish. This minimizes branch churn but requires careful review to avoid normalizing accidental architecture.

### Approach D: Host Substrate First

Before expanding runtime or panel behavior, converge VS Code, TS plugin, `vmc`, and Vite on one shared generated-artifact/cache path with bounded invalidation. This directly addresses stability and performance, but risks delaying user-visible compiler/HMR and DevTools proof if treated as a broad substrate rewrite.

### Approach E: Configuration Convergence First

Map how `typed.config.ts`, Vite plugin options, `vmc`, TypeScript plugin, and VS Code currently discover and adapt project configuration, then collapse duplicated option plumbing into shared loaders/adapters. This directly reduces drift, but it should stay tied to failing stability and cross-surface tests rather than becoming a generic config redesign.

### Approach F: Import-Precise Production Output

Make plugin output production-aware by deriving emitted exports and helper imports from actual user import usage plus the dependency graph needed to satisfy those imports. This keeps builds smaller and safer, but it requires a shared reachability model so plugins remain DRY and type-safe.

## Recommendation

Start with Approach C plus the narrow parts of Approach D, Approach E, and Approach F: hard red lines for misleading public surfaces, while researching the current host/cache/config/import-usage substrate before implementation. The immediate hard red line is generated client cleanup: `TypedClient` and generic-erasing wrappers must be removed from the accepted release surface before we trust downstream RealWorld or Storybook client usage. The second hard line is host stability: VS Code and TS plugin must share efficient cached artifacts and avoid unbounded hot-path recomputation. The third hard line is surface consistency: Storybook and app builds must consume the same generated contracts, with shared configuration adapted into each host rather than duplicated. The fourth hard line is production precision: all plugins must preserve type safety while emitting only user-consumed import surfaces and required dependencies.

## Source Grounding

- consulted_specs:
  - `.docs/specs/virtual-modules/spec.md` for virtual-module terminology, TypeInfoApi, host adapter, and watcher responsibilities.
  - `.docs/specs/typed-devtools/spec.md` for live protocol/runtime/compiler/Chrome DevTools boundaries.
- consulted_adrs:
  - `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md` for compiler versus `vmc` and HMR boundaries.
  - `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md` for package ownership and RealWorld as compliance fixture.
- consulted_workflows:
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/intent.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/scope.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/requirements.md`

## Initial Memory Strategy

- Capture workflow-local observations in `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/`.
- Promote durable lessons only after execution proves them with tests or logs.
- Track `TypedClient` removal as a candidate durable memory if implementation confirms it is the stable generated-client policy.
