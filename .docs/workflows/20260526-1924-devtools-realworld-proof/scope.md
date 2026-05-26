# Scope - DevTools RealWorld End-To-End Proof

Status: draft pending explicit human approval.

## In Scope

### RealWorld Proof Harness

- Add or validate an explicit RealWorld devtools smoke mode.
- Preserve normal RealWorld builds with devtools disabled by default.
- Use RealWorld as the acceptance fixture for runtime bridge, panel connection, and app interaction proof.
- Run proof through generated runtime paths, not hand-built app-only mocks.
- Capture exact commands, ports, environment variables, and browser steps needed to reproduce the proof.

### Runtime And Bridge Truthfulness

- Verify the generated browser runtime creates one devtools runtime/event bus when devtools is enabled.
- Verify the DOM registry, app bridge, and runtime event replay share that runtime.
- Verify handshake capability negotiation only advertises capabilities that the inspected RealWorld runtime can serve.
- Verify unavailable states are explicit and user-visible when a capability is not wired.
- Keep fixture data out of live-connected proof paths.

### Fx Graphs

- Prove at least one RealWorld Fx path emits live `FxNodeEvent` data through the runtime stream.
- Preserve Fx semantics; instrumentation must remain diagnostic-only.
- If full graph topology is not yet available, separate "events available" from "graph topology unavailable" in docs and UI.

### Component Tree, DOM, Source Deep Links

- Prove component/template mount data from RealWorld reaches the panel.
- Prove DOM selection or DOM action can resolve from panel to RealWorld mounted nodes when the DOM registry has a binding.
- Prove source links through compiler/source facts when available.
- If source Analyzer/dev-server bridge is unavailable, prove the unavailable state and document the missing compiler/dev-server dependency.

### RefSubject States

- Prove at least one RealWorld RefSubject snapshot/update reaches the panel with version, value summary, and subscriber count when available.
- Keep value serialization bounded and redacted through protocol helpers.
- Preserve service/owner identity where compiler/runtime hooks provide it.

### HMR

- Prove RealWorld HMR facts distinguish template optimization from state-preserving HMR eligibility.
- Prove rejection reasons remain structured and visible.
- Reuse the existing RealWorld HMR local harness where possible.
- Coordinate compiler-owned HMR capability gaps with the parallel compiler agent.

### Navigation

- Prove RealWorld navigation events reach the runtime event bus and panel.
- Include push/replace/traverse/reload semantics where current `@typed/navigation` surfaces expose them.
- Link Navigation events to route/component/source facts where correlation ids are available.

### OTEL

- Prove OTEL span events render in the panel with trace id, span id, span name, and Typed correlation ids.
- Preserve OpenTelemetry trace/span identity and parent/child/link concepts in requirements and later implementation.
- Decide in Phase 2 whether first proof uses Effect observability, local protocol fixtures from real spans, browser JS SDK instrumentation, or server/client propagation.

### Verification And Documentation

- Produce acceptance criteria that map each requested capability to a RealWorld proof.
- Add focused tests before implementation in Phase 4.
- Commit only after approved docs or completed task slices, as required by the workflow.
- Maintain workflow-local memory notes for blockers, commands, and integration facts.

## Out Of Scope Unless Explicitly Expanded

- Broad compiler-capability implementation already owned by the parallel agent.
- Broad redesign of the Chrome panel visual layout.
- Production telemetry or remote analytics.
- Firefox/Safari extension support.
- Making devtools enabled by default in production or normal RealWorld builds.
- Replacing OpenTelemetry with a Typed-only tracing format.
- Reworking VS Code/TS plugin surfaces unless needed only to validate source-link assumptions.
- Cleaning unrelated dirty files or absorbing concurrent work.
- Publishing a Chrome Web Store extension.

## Coordination Boundaries

- Compiler facts are a dependency. This workflow may consume them, validate them, and document missing facts.
- Runtime/app/bridge/panel proof gaps are in scope when they are necessary to prove RealWorld.
- If proof requires compiler changes, pause at the smallest reproducible missing fact and ask whether to patch it here or hand it to the compiler-capability agent.
- If concurrent edits touch a file needed by this workflow, inspect and work with those edits; do not revert them.

## Phase 1 Acceptance

Phase 1 is complete only when the human explicitly approves:

- `intent.md`
- `scope.md`

After approval, commit the Phase 1 docs and continue to Phase 2 requirements.

