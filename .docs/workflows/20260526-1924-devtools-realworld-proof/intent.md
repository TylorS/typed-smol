# Intent - DevTools RealWorld End-To-End Proof

Status: draft pending explicit human approval.

## Problem

Typed already has DevTools protocol, runtime, app bridge, Chrome panel, compiler fact, Fx capture, RefSubject capture, DOM registry, Navigation capture, HMR fact, and OTEL correlation pieces. The current product risk is that those pieces can still be true in isolation while the RealWorld app cannot prove the actual user promise end to end.

The intended proof target is the RealWorld example. It should demonstrate that a real Typed app can expose live DevTools data for:

- Fx graphs;
- component tree with source and DOM deep links;
- RefSubject states;
- HMR optimization and stateful-HMR status;
- Navigation;
- OTEL spans and Typed correlations.

The human clarified that another agent is currently finalizing compiler capabilities. This workflow should therefore focus on RealWorld proof, integration hardening, missing end-to-end runtime/bridge/panel acceptance, and clear dependency boundaries with the compiler-capability lane.

## Desired Outcome

Create a strict-mode path to prove Typed DevTools with RealWorld instead of fixtures alone.

The intended end state is:

- RealWorld has an explicit devtools smoke mode that enables the generated browser runtime bridge without enabling devtools in normal builds.
- The Chrome DevTools panel connects to the inspected RealWorld app and shows live runtime status, not seeded fixture data.
- The panel can show or explicitly report unavailable states for every requested capability: Components, DOM/source links, Fx, RefSubjects, HMR, Navigation, OTEL, and Sources.
- RealWorld interactions produce visible runtime events for navigation, state updates, component/template mounting, and any Fx/OTEL paths that are wired by the compiler/runtime layer.
- Source/deep-link behavior is proven against compiler/source facts when available, and blocked honestly when the parallel compiler work has not landed.
- Tests and smoke commands distinguish protocol/runtime package correctness from RealWorld end-to-end readiness.
- Any remaining compiler dependency is documented as a real blocker with exact missing data, not hidden inside the panel.

## Product Thesis

Typed DevTools is only real when a non-trivial Typed app can prove the full chain:

compiler facts -> generated app runtime -> dev-only bridge -> Chrome panel -> user-visible diagnostics.

Fixtures are useful for protocol and UI development, but RealWorld is the acceptance target for claiming end-to-end support.

## Decisions

- Mode: `strict`.
- Finalization: `merge`.
- Create a fresh workflow folder: `.docs/workflows/20260526-1924-devtools-realworld-proof`.
- Treat previous devtools/cohesion workflows as references only.
- Use RealWorld as the proof app.
- Preserve devtools-disabled default behavior in RealWorld.
- Add or use explicit devtools smoke mode for proof.
- Coordinate with the parallel compiler-capability agent. This workflow owns proof and integration hardening unless the human explicitly expands compiler ownership.
- Do not claim Fx graphs, source deep links, RefSubject states, HMR, Navigation, or OTEL are working unless RealWorld proves that capability through the live bridge or reports a precise unavailable state.

## Open Questions

- Should this workflow be allowed to patch narrow compiler fact emission gaps when RealWorld proof exposes them, or should it stop and hand those gaps back to the compiler-capability agent?
- Should the first RealWorld proof run through the actual Chrome extension, Playwright against the extension package, or a headless inspected-window bridge smoke before full Chrome automation?
- Which RealWorld route should be the canonical smoke scenario: home feed, login/settings, article/editor, profile, or the existing HMR route?
- What level of OTEL proof is required for the first pass: protocol event rendering, Effect span correlation, browser JS SDK integration, or server/client trace propagation?

## Approval Rule

Do not commit or proceed to Phase 2 until the human explicitly approves `intent.md` and `scope.md`.

