## Problem Statement

Typed is gaining parallel work on UI primitives, compiler behavior, Storybook integration, and virtual-module infrastructure. The next product question is what developer tooling Typed should provide so application authors can see, inspect, debug, and trust those framework surfaces while they build.

The initial request names Chrome extension support as at least one required surface. The human then clarified that this surface will be a Chrome DevTools panel, and that key product goals are active visibility into Fx stream graphs, RefSubject state for Inferred Components, HMR optimization status and rejection reasons, Navigation events, and OTEL trace visualization.

Because Typed already has CLI, Vite, Storybook, compiler, virtual-module, TypeScript plugin, VS Code extension, `@typed/fx`, and `@typed/template` surfaces, the work needs to define a coherent tooling system rather than a standalone browser add-on.

## Desired Outcomes

- Define the product intent for Typed developer tooling.
- Treat a Chrome DevTools panel as the first browser tooling surface.
- Make reactive runtime introspection a primary goal:
  - Fx stream graph topology, subscriptions, emissions, errors, interruptions, and lifetimes.
  - RefSubject current state, versions, subscribers, update history, and ownership.
  - Inferred Components that the compiler/runtime can associate with RefSubject-backed state.
- Show HMR optimization and preservation status:
  - which components/templates are optimized;
  - which route components/dependencies are stateful-HMR eligible;
  - which are rejected and the exact reason.
- Show Navigation events and transitions as a timeline linked to routes, Fx emissions, RefSubject updates, and traces.
- Visualize OTEL traces as trace trees/timelines using trace/span identity, attributes, events, status, and timing.
- Identify the relationship between browser tooling, Storybook tooling, VS Code tooling, CLI diagnostics, Vite dev server behavior, `vmc`, and `@typed/compiler`.
- Preserve Typed's virtual-module-first architecture and shared diagnostic model.
- Establish a narrow Phase 1 scope that can later become requirements, specification, and implementation milestones.

## Constraints and Assumptions

- Strict-mode stage order applies: brainstorming, research, requirements, specification, planning, execution, finalization.
- Finalization target is merge, not PR.
- Phase 1 artifacts are draft until the human explicitly approves `intent.md` and `scope.md`.
- No implementation code is in scope during Phase 1.
- The current dirty worktree includes concurrent agent work and must not be reverted or normalized by this workflow.
- Chrome extension work should target Manifest V3 unless research later proves a narrower internal/dev-only model is better.
- A Chrome DevTools extension can add panels and sidebars through a `devtools_page`, but its DevTools APIs only exist in pages loaded inside DevTools.
- MV3 service workers are event-driven and can terminate; extension state must not rely on long-lived globals.
- DevTools extensions currently have Chrome-specific messaging caveats: Chrome docs note DevTools extensions should continue using `chrome.*`, and promise-style message listener behavior is not enabled in DevTools extension contexts.
- Typed already has a VS Code extension for virtual module navigation; browser tooling should complement it rather than duplicate editor responsibilities.

## Known Unknowns and Risks

- What exact runtime facts should an Fx stream graph expose without changing normal stream semantics?
- What makes a component "Inferred": compiler-detected route components, `@typed/ui` stateful components, template components, or any RefSubject-owning runtime boundary?
- Which RefSubject values are safe and useful to display by default, and which should require opt-in serializers or redaction?
- How should the panel present the distinction between optimized template output and state-preserving HMR eligibility?
- Which HMR rejection reasons need human-readable explanations first: anonymous RefSubject state, explicit opt-out, incompatible boundary, missing service identity, dependency cycle, or unsupported capture?
- Should Navigation events be sourced from `@typed/navigation` hooks, RefSubject state changes, browser history events, or all three with deduplication?
- Should OTEL traces come from Effect's unstable observability/OTLP surfaces, browser-side instrumentation, a dev-only collector bridge, or imported trace payloads?
- What app-side runtime bridge is acceptable for development builds, and how is it excluded from production?
- How much of the tooling protocol should be shared across Chrome, Storybook, CLI, Vite, and VS Code?
- Should the first tranche prioritize the Fx graph, the RefSubject state panel, or a thin route/component inspector that links both?
- What privacy/security boundary should govern inspected app data, route params, API payloads, environment/config exposure, and server diagnostics?
- What should be a polished product now versus internal instrumentation for the beta?

## Candidate Approaches

### Approach A: DevTools Panel With Reactive Runtime Bridge

Build the first developer-tooling tranche around a Chrome DevTools panel for running Typed apps, backed by a development-only runtime bridge that observes Fx, RefSubject, HMR, Navigation, and trace activity.

Pros:
- Matches developer expectations for framework inspection.
- Can associate with the inspected tab and use DevTools APIs.
- Good home for Fx stream graphs, RefSubject state, route state, Navigation events, virtual modules, app layers, diagnostics, HMR/resumability status, OTEL traces, and server/client event traces.
- Anchors the work in a visible product immediately.

Cons:
- MV3 DevTools extensions have special messaging and lifecycle constraints.
- Requires an app-side dev bridge before the panel can inspect Typed-specific state.
- Requires new instrumentation boundaries for Fx graph nodes, emissions, state snapshots, HMR status, Navigation events, trace spans, and component ownership.

### Approach B: Shared Tooling Protocol First

Define a host-neutral tooling protocol and data model first, then make the Chrome DevTools panel the first client of that protocol.

Pros:
- Fits Typed's existing shared-diagnostics direction across CLI, Vite, TS plugin, VS Code, and Storybook.
- Reduces drift between browser tooling, Storybook tooling, and editor tooling.
- Makes DevTools panel implementation thinner and easier to test.
- Gives Fx, RefSubject, HMR, Navigation, and OTEL instrumentation a stable schema before UI polish.

Cons:
- Slower to reach a visible DevTools panel.
- May over-abstract if requirements are not anchored by one real UI surface.

### Approach C: Storybook + Chrome Extension Twin Surface

Use Storybook as the controlled harness for developer-tooling capabilities and the Chrome DevTools panel as the live-app inspection surface.

Pros:
- Aligns with the active Storybook runtime-harness work.
- Gives deterministic fixtures for the Chrome extension protocol.
- Separates reproducible component/workflow states from live inspected-page debugging.

Cons:
- Broader first tranche.
- Requires careful boundaries so Storybook does not become the only supported debug environment.

## Recommendation

Use Approach B as the architecture, but Approach A as the visible first product slice.

The first durable decision should be a Typed developer-tooling protocol and capability model shared by `@typed/compiler`, `vmc`, Vite, Storybook, VS Code, and browser tooling. The first visible surface is a Chrome DevTools panel that consumes that protocol from a development-only app bridge.

The first panel should center on live reactive introspection: Fx stream graph topology and RefSubject state attached to compiler/runtime-inferred components. HMR status, Navigation events, OTEL traces, route/template facts, virtual-module facts, and diagnostics should connect into that graph rather than sit as unrelated tabs.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-framework-starter/spec.md` for `typed create`, `typed:server`, `typed:browser`, `typed:config`, `typed:env`, Vite, and app-mode scope.
  - `.docs/specs/virtual-modules/spec.md` for the virtual-module host model, TypeInfo API, adapter responsibilities, and source identity.
  - `.docs/specs/virtual-module-artifact-store/spec.md` by reference from ADRs for persistent generated artifacts and cross-surface reuse.
  - `.docs/specs/storybook-framework-integration/spec.md` by reference from ADRs for the server-aware Storybook direction.
- consulted_adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md` for virtual-module-first architecture.
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md` for shared artifact contracts across Vite, vmc, TS plugin, and VS Code.
  - `.docs/adrs/20260522-2058-storybook-runtime-harness-first.md` for Storybook as a server-aware but deterministic tooling harness.
  - `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md` for shared diagnostics across CLI, Vite, TS plugin, and VS Code.
- consulted_workflows:
  - `.docs/workflows/20260522-2049-storybook-framework-integration/intent.md`
  - `.docs/workflows/20260522-2049-storybook-framework-integration/scope.md`
  - `.docs/workflows/20260522-2104-serializable-template-tooling/intent.md`
  - `.docs/workflows/20260522-2104-serializable-template-tooling/scope.md`
- consulted_code:
  - `packages/fx/src/Fx/Fx.ts` for the core Fx stream type and service model.
  - `packages/fx/src/RefSubject/RefSubject.ts` for mutable reactive state, versions, subscribers, and service-backed RefSubjects.
  - `packages/compiler/src/route/RouteModulePlan.ts` for compiler facts around RefSubject services, inline RefSubjects, templates, closures, and diagnostics.
  - `packages/compiler/src/route/analyzeRouteModule.ts` for existing detection of `@typed/ui` stateful components, inline state factories, RefSubject services, and template facts.
  - `packages/compiler/src/hmr/analyzeComponentHmr.ts` for current component HMR service descriptors.
  - `packages/compiler/src/hmr/dependencies.ts` and `packages/compiler/src/capabilities/compileCapabilities.ts` for HMR participants, rejections, explicit opt-outs, and optimized template capability facts.
  - `packages/navigation/src/Navigation.ts` and `packages/navigation/src/model.ts` for Navigation events, transitions, destinations, hooks, and reactive navigation state.
  - `packages/fx/src/Fx/combinators/withSpan.ts` for the existing Fx span bridge into Effect tracing.
- consulted_external_sources:
  - Chrome extension Manifest V3 documentation.
  - Chrome DevTools extension documentation.
  - Chrome `devtools.panels` API reference.
  - Chrome extension messaging documentation.
  - Chrome Side Panel API reference.
  - Chrome extension service-worker lifecycle documentation.
  - OpenTelemetry tracing API and overview docs for trace/span data model, span events, attributes, status, timing, parent/child relationships, and current spec versions.

## Initial Memory Strategy

- Keep short-term discoveries in this workflow until requirements and specification stabilize.
- Promote durable decisions only if they define reusable Typed tooling architecture, such as a canonical tooling protocol, Chrome extension boundary, or shared diagnostics contract.
- Do not promote Chrome API caveats as durable project memory unless they directly shape implementation constraints.
