# Intent - Developer Tooling And Chrome Extension

Status: approved on 2026-05-23.

## Problem

Typed is becoming more than a library set. UI primitives, compiler transforms, Storybook runtime support, Vite integration, virtual modules, and editor tooling are converging into a framework. Developers will need tooling that explains what Typed generated, what it inferred, how runtime state is flowing, and why a route, template, app layer, HMR update, or virtual module behaves the way it does.

The immediate product direction is to begin exploring first-class developer tooling through a Chrome DevTools panel. The panel should make Typed's reactive runtime visible, especially Fx stream graphs, RefSubject state for Inferred Components, HMR optimization status and rejection reasons, Navigation events, and OTEL traces.

## Desired Outcome

Define a strict-mode roadmap for developer tooling that makes Typed applications inspectable and debuggable across the surfaces developers already use.

The intended end state is:

- A coherent Typed developer-tooling system, not a one-off extension.
- A Chrome DevTools panel for live Typed app inspection.
- A shared tooling protocol/data model that can also serve Storybook, CLI, Vite, VS Code, and TypeScript plugin surfaces.
- Runtime inspection for Fx stream graphs, RefSubject state, Inferred Components, route state, Navigation events, app layers, Effect service boundaries, template/HMR participation, virtual modules, diagnostics, OTEL traces, and server/client workflow events where appropriate.
- A panel experience that can show how a value moves through Fx operators, which component or route owns it, what RefSubject currently stores, and what update caused a visible UI change.
- Compiler and runtime instrumentation around `Fx`, `RefSubject`, inferred components, and generated framework surfaces where those hooks are necessary to support the panel truthfully.
- A HMR view that shows which components/templates were optimized, which route components/dependencies are stateful-HMR eligible, which were rejected, and the concrete reason for each rejection.
- A Navigation timeline that shows transitions, before-navigation hooks, committed navigation events, redirects/cancellations where visible, and their relationship to route matching and reactive updates.
- An OTEL trace view that can render trace/span trees and timing waterfalls, then correlate spans with Typed routes, Fx streams, Navigation events, and server/client boundaries where possible.
- Build-time and editor-time diagnostics that use the same compiler diagnostic model instead of host-specific messages.
- Development-only instrumentation with explicit privacy/security boundaries.

## Product Thesis

Typed developer tooling should make the invisible framework graph visible without taking control away from the user.

The tool should show explicit virtual modules, typed app composition, compiler decisions, server/client boundaries, reactive graph state, and diagnostics as first-class objects. The DevTools panel is the first product surface, while the durable product should be a shared introspection model reused by the rest of the Typed toolchain.

## Priority Biases

- Chrome DevTools panel as the required browser surface.
- Shared tooling protocol before panel-specific logic.
- Fx and RefSubject observability before broad extension polish.
- HMR eligibility and rejection reasons before "it hot reloaded" summaries.
- Navigation and trace timelines before isolated event logs.
- Real Typed app/runtime data before decorative dashboards.
- Compiler/runtime/source evidence before generic logs.
- Development-only bridges before any production telemetry.
- Virtual-module-first architecture before hidden framework ownership.
- Typed diagnostics before stringly host-specific errors.
- Small useful panels before a broad suite of half-connected tools.

## Open Questions

- What is the first DevTools panel view: Fx stream graph, RefSubject state table, or an Inferred Component tree that links both?
- What counts as an Inferred Component for the first tranche: route components, compiler-visible template components, `@typed/ui` stateful components, or any RefSubject-owning boundary?
- How should Fx graph nodes be identified: source locations, compiler fingerprints, runtime ids, operator names, service ids, or a combination?
- How should RefSubject values be serialized/redacted for display?
- How should HMR status distinguish template optimization, component eligibility, dependency participation, explicit opt-out, anonymous state, and unsupported compiler shapes?
- Which Navigation event fields are visible by default, and which `state`/`info` payloads require redaction or custom serializers?
- Should OTEL traces be consumed from Effect's unstable observability surfaces, a local OTLP collector/exporter bridge, browser instrumentation, or fixture/imported trace data first?
- Should the first implementation start from a shared protocol package or from a Chrome DevTools prototype that extracts the protocol afterward?
- What runtime bridge should a Typed app expose in development, and how should it be disabled or stripped from production builds?
- How should sensitive values be redacted, especially env/config values, route params, API payloads, cookies, headers, and server errors?
- Should Storybook act as the primary fixture harness for developer-tooling acceptance tests?
- Should this become a new package such as `@typed/devtools`, `@typed/chrome-extension`, or a broader tooling package with extension clients?

## Decisions

- Mode: `strict`.
- Finalization: merge.
- Create a fresh workflow folder; do not reuse previous workflows.
- Treat current UI, compiler, Storybook, and virtual-module edits as concurrent work not owned by this workflow.
- The Chrome surface is a DevTools panel.
- The DevTools panel must prioritize live Fx stream graphs, RefSubject state for Inferred Components, HMR optimization status, Navigation events, and OTEL trace visualization.
- `Fx` and `RefSubject` instrumentation is expected to require compiler/runtime work, not only Chrome panel UI work.
- Do not assume Chrome is the canonical source of tooling truth.
- Preserve existing Typed constraints:
  - virtual modules remain explicit framework surfaces;
  - no filesystem routing;
  - `@typed/compiler` integrates with `vmc` rather than replacing it;
  - diagnostics should be shared across CLI, Vite, TS plugin, VS Code, and browser tooling where possible.

## Approval Rule

Approved. Continue to strict-mode research.
