## Problem Statement

Typed needs a Storybook integration that moves beyond the old browser-only renderer and becomes a framework-aware workshop for UI, routing, SSR, HttpApi, and server-backed workflows.

## Desired Outcomes

- Establish a shared problem definition for a deep Typed Storybook framework integration.
- Identify what the old `@typed/storybook` renderer proves and where it is too narrow.
- Bound Phase 1 around intent and scope before requirements or implementation.
- Carry explicit unknowns into research instead of prematurely selecting an implementation architecture.

## Constraints and Assumptions

- Mode is `strict`; required stage order is brainstorming, research, requirements, specification, planning, execution, finalization.
- Finalization target is merge into `codex/typed-beta`.
- Storybook APIs are time-sensitive; research must use current official documentation.
- Existing dirty files in the checkout are unrelated context and must not be reverted.
- Typed remains virtual-module-first.
- Router modules remain environment-agnostic; server-only behavior belongs in server/API/storybook-specific surfaces.
- Framework-facing Effect code should preserve explicit error and service typing where practical.

## Known Unknowns and Risks

- The first vertical slice is not yet selected.
- Server-side story execution model is undecided.
- Storybook v10 framework API details need deeper research before requirements are final.
- It is unclear whether the first fixture should be RealWorld or a smaller purpose-built app.
- The integration could become too broad unless the first tranche proves one path end to end.

## Candidate Approaches

### Renderer-first

Port the old renderer to the current repo and Storybook version, then layer server-aware decorators on top.

Pros:
- Fastest path to visible component stories.
- Reuses the old `renderToCanvas` idea.

Cons:
- Risks repeating the old browser-only boundary.
- Server-side code becomes an addon afterthought.

### Runtime-harness-first

Design a Storybook story runtime that can run Typed app layers, route/request context, SSR render paths, and HttpApi calls in memory, then connect it to a renderer.

Pros:
- Centers the next/remix/sveltekit-style goal.
- Good fit for portable tests and server-backed interactions.

Cons:
- Requires careful boundaries between Storybook story context and Typed runtime context.

### Dev-server-integration-first

Integrate Storybook's Vite dev server with Typed's Vite/vavite server lifecycle so stories exercise a real local server path.

Pros:
- Highest framework fidelity.
- Proves realistic server/client integration early.

Cons:
- More operationally complex.
- Might delay a minimal usable renderer.

## Recommendation

Start by researching and requirements-shaping a runtime-harness-first design, while keeping the dev-server integration as a required research branch. This best matches the user's intent to test server-side code with UI and components without immediately making every story depend on a real network server.

The first tranche should still include a small renderer because Storybook needs a canvas path, but the architecture should be driven by app/runtime fidelity rather than a renderer-only port.

## Source Grounding

- consulted_specs:
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `.docs/specs/typed-config/spec.md`
- consulted_adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260516-1643-vavite-backed-typed-http-server.md`
  - `.docs/adrs/20260516-1318-httpapi-generated-source-effect-source-of-truth.md`
- consulted_workflows:
  - `.docs/workflows/20260515-2018-typed-framework-evolution/`
  - `.docs/workflows/20260516-1826-realworld-flagship-example/`
  - `.docs/workflows/20260521-2247-typed-native-ariakit-port/`

## Initial Memory Strategy

- Capture short-term decisions in this workflow's `intent.md`, `scope.md`, and later stage artifacts.
- Add `memories.md` during execution only when implementation details become useful for later agents.
- Promote durable architecture decisions to ADRs or `.docs/specs/` rather than duplicating canonical policy in workflow notes.
