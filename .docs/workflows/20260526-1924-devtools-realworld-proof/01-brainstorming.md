## Problem Statement

Typed DevTools must be proven against RealWorld, not only package fixtures. The proof needs to cover Fx graphs, component tree and deep links, RefSubject states, HMR, Navigation, and OTEL through the real generated browser/runtime bridge.

## Desired Outcomes

- A RealWorld devtools proof path that can be run locally.
- Live inspected-app data in the Chrome panel or a precise unavailable state for each requested capability.
- Clear separation between runtime/app/bridge/panel gaps owned by this workflow and compiler fact gaps owned by the parallel compiler-capability agent.
- Acceptance criteria in Phase 2 that prevent fixture-backed false positives.

## Constraints and Assumptions

- Strict mode with merge finalization is selected.
- RealWorld remains the proof app.
- Normal RealWorld builds should not enable devtools.
- The current checkout is dirty; unrelated or concurrent changes must not be reverted.
- Compiler capability work is concurrent and should be treated as a dependency unless the human expands ownership.
- Chrome DevTools APIs are available only to DevTools pages while DevTools is open, and inspected-window eval returns JSON-compatible values from the inspected page.
- Chrome extension messaging boundaries require validation and sanitization of page/content-script data.
- OpenTelemetry traces are span-based DAGs and should remain trace/span-oriented in the DevTools model.
- OpenTelemetry JavaScript browser instrumentation is current but still has browser-specific caveats; first-pass OTEL proof should keep the source explicit.

## Known Unknowns and Risks

- Whether RealWorld already has enough compiler facts to populate component/source ownership.
- Whether RealWorld has any Fx paths instrumented with `Fx.withDevtools` or whether the compiler/runtime needs to wrap component-owned roots.
- Whether RefSubject service identities are present for the RealWorld state paths we want to prove.
- Whether Navigation capture is wired into the real router layer or only exists as a package utility.
- Whether OTEL should be proven from Effect observability, browser SDK spans, server spans, or protocol events in the first slice.
- Whether Chrome extension automation can load the built extension reliably in this environment, or whether the first proof should use an inspected-window bridge smoke first.
- Whether missing `hurl` still blocks RealWorld acceptance gates.

## Candidate Approaches

### Approach A: RealWorld Smoke Harness First

Create a RealWorld devtools smoke mode and prove the generated app bridge stream end to end before broad panel polish.

Pros:

- Directly matches the human's acceptance target.
- Finds truthfulness gaps quickly.
- Avoids over-investing in fixtures.

Cons:

- May block on compiler facts still being finalized by another agent.
- Browser extension automation can be slower to stabilize.

### Approach B: Runtime/Protocol Contract First

Tighten protocol/runtime/bridge tests until every capability has reliable event and unavailable-state behavior, then attach RealWorld.

Pros:

- Easier red/green cycle.
- Reduces ambiguity in protocol boundaries.

Cons:

- Can still miss generated RealWorld wiring failures.
- Risk of another fixture-backed false positive.

### Approach C: Compiler Facts First

Wait for or implement compiler facts for component/source/Fx/RefSubject/HMR, then prove the UI.

Pros:

- Gives richer panel data when the proof starts.
- Reduces partial/unavailable states.

Cons:

- Conflicts with the stated parallel compiler ownership.
- Delays proving runtime/bridge/panel truthfulness.

## Recommendation

Use Approach A, with a narrow contract from Approach B.

The first implementation plan should create the smallest RealWorld devtools proof that can connect the generated app runtime to the panel or inspected-window bridge, exercise one real route interaction, and assert which capabilities produce live data versus explicit unavailable states. Compiler fact gaps should be documented with exact missing ids/events and handed back unless the human explicitly approves patching them in this workflow.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-devtools/spec.md`
  - `.docs/specs/typed-devtools/testing-strategy.md`
- consulted_adrs:
  - `.docs/adrs/20260523-1703-typed-devtools-protocol-boundaries.md`
- consulted_workflows:
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/intent.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/scope.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/requirements.md`
- consulted_code:
  - `packages/devtools-protocol/src/Schemas.ts`
  - `packages/devtools-runtime/src/Bridge.ts`
  - `packages/devtools-runtime/src/DomRegistry.ts`
  - `packages/devtools-runtime/src/FxCapture.ts`
  - `packages/devtools-runtime/src/RefSubjectCapture.ts`
  - `packages/devtools-runtime/src/NavigationCapture.ts`
  - `packages/devtools-chrome/src/panel/app.ts`
  - `packages/devtools-chrome/src/panel/state.ts`
  - `packages/app/src/internal/emitBrowserSource.ts`
  - `examples/realworld/typed.config.ts`
  - `examples/realworld/package.json`
- consulted_web:
  - Chrome DevTools extension docs
  - Chrome inspectedWindow docs
  - Chrome extension messaging docs
  - OpenTelemetry specification overview
  - OpenTelemetry JavaScript docs

## Initial Memory Strategy

- Keep workflow-local findings in this folder until Phase 4 tasks produce stable facts.
- Promote only durable cross-workflow facts after verification, such as RealWorld devtools smoke commands, known compiler dependency boundaries, or exact end-to-end proof blockers.

