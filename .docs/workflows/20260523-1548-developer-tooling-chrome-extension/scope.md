# Scope - Developer Tooling And Chrome Extension

Status: approved on 2026-05-23.

## In Scope

### Developer Tooling Product Shape

- Define the developer problems Typed tooling should solve first.
- Identify the first author-facing surfaces:
  - Chrome DevTools extension;
  - Storybook tooling/runtime harness;
  - VS Code virtual-module/editor integration;
  - CLI and `vmc` diagnostics;
  - Vite dev server/HMR integration.
- Decide which surface owns each kind of interaction and which concerns belong in shared packages.

### Chrome DevTools Panel Exploration

- Treat a Chrome DevTools panel as the required browser tooling surface.
- Evaluate supporting extension pieces only insofar as they serve the panel:
  - `devtools_page`;
  - panel HTML/runtime;
  - content script/injected page bridge;
  - service worker message relay;
  - optional sidebar/side-panel follow-ups.
- Account for current MV3 constraints:
  - service-worker lifecycle;
  - local packaged code only;
  - message-passing semantics;
  - DevTools page API availability;
  - Chrome-specific `chrome.*` namespace behavior for DevTools extensions.
- Define the minimum development-only bridge a Typed app must expose for inspection.
- Define security and privacy boundaries for inspected runtime data.

### Reactive Runtime Introspection

- Make Fx stream graph visualization a first-class requirement candidate:
  - stream/operator nodes;
  - parent/child and subscription edges;
  - current subscribers;
  - emissions, failures, interruptions, completion, and timing;
  - source locations or compiler-derived identities where available.
- Make RefSubject state inspection a first-class requirement candidate:
  - current value;
  - version;
  - subscriber count;
  - update history;
  - service id or inferred owner;
  - safe serialization/redaction policy.
- Define "Inferred Components" for tooling purposes:
  - compiler-detected route/template/component boundaries;
  - `@typed/ui` stateful components detected through imports and `makeState`;
  - RefSubject services and inline RefSubject-producing state factories detected by route/HMR analysis.
- Decide which facts come from compiler analysis, which come from runtime instrumentation, and which require explicit user annotations.
- Include compiler/runtime instrumentation design for `Fx` and `RefSubject` where current values do not expose enough graph, source, ownership, timing, subscription, or update metadata.
- Treat instrumentation as a first-class implementation surface, not an afterthought added by the Chrome panel.

### HMR Optimization And Rejection Visibility

- Show which templates/components are compiler-optimized.
- Show which route components are stateful-HMR eligible.
- Show which dependency modules participate in stateful HMR and why:
  - imported;
  - route companion;
  - explicit opt-in.
- Show rejected HMR candidates and reasons:
  - anonymous RefSubject state;
  - explicit opt-out;
  - unsupported or incompatible compiler/runtime boundary;
  - dependency graph cycle or skipped imports where applicable.
- Preserve the distinction between optimized template output and state-preserving HMR. A component can have optimized template output without being safe for stateful HMR.

### Navigation Event Timeline

- Show `@typed/navigation` transitions and committed navigation events.
- Include navigation type:
  - push;
  - replace;
  - reload;
  - traverse.
- Include origin/destination, current entry, history entries, can-go-back/can-go-forward state, and transition state where safe.
- Show before-navigation hooks, redirects, cancellations, and blocked navigation outcomes where observable.
- Link Navigation events to route matching, Fx emissions, RefSubject updates, and trace spans when correlation ids are available.

### OTEL Trace Visualization

- Visualize OpenTelemetry traces as both:
  - parent/child span trees;
  - timing waterfalls.
- Preserve OpenTelemetry concepts:
  - trace id;
  - span id;
  - parent span id;
  - span name;
  - start/end timestamps and duration;
  - attributes;
  - events;
  - links;
  - status.
- Explore whether trace data arrives through Effect's unstable observability/OTLP surfaces, a dev-only local collector/exporter bridge, browser instrumentation, imported fixture payloads, or multiple sources.
- Correlate spans with Typed-specific facts where possible:
  - route;
  - Navigation event;
  - Fx stream node;
  - RefSubject update;
  - server/client boundary;
  - virtual module/compiler diagnostic.
- Do not replace OpenTelemetry's trace/span model with a proprietary event model.

### Shared Tooling Protocol

- Explore a host-neutral protocol/data model for:
  - Fx graph snapshots and event streams;
  - RefSubject state snapshots and updates;
  - Inferred Component ownership;
  - HMR optimization, eligibility, dependency participation, and rejection reasons;
  - Navigation event timeline entries and transition state;
  - OpenTelemetry trace/span payloads and Typed correlation metadata;
  - routes and navigation state;
  - app/config/env summaries;
  - virtual-module artifacts and dependencies;
  - compiler diagnostics;
  - template/HMR participation;
  - Effect layers/services where inspectable;
  - server/client workflow events;
  - Storybook scenario state.
- Decide whether this protocol belongs in a new package or in existing compiler/app/virtual-module packages.
- Keep the protocol compatible with browser extension messaging and local development hosts.

### Existing Typed Surface Integration

- Reuse current systems where possible:
  - `@typed/compiler`;
  - `@typed/virtual-modules`;
  - `@typed/virtual-modules-compiler` / `vmc`;
  - `@typed/virtual-modules-vscode`;
  - `@typed/virtual-modules-ts-plugin`;
  - `@typed/virtual-modules-vite`;
  - `@typed/vite-plugin`;
  - `@typed/storybook`;
  - `@typed/app`;
  - `typed:server`, `typed:browser`, `typed:config`, `typed:env`;
  - `typed create` starter conventions.
- Preserve the artifact store and shared-diagnostics direction.
- Avoid local virtual-module shims and duplicated analyzers.
- Expect changes in compiler/runtime surfaces where needed to produce reliable `Fx` graph, RefSubject state, HMR, Navigation, and trace facts.

### Research And Design Deliverables

- Produce requirements for the first developer-tooling tranche.
- Compare at least three design approaches:
  - DevTools panel with reactive runtime bridge first;
  - shared tooling protocol first;
  - Storybook + Chrome extension twin-surface first.
- Define acceptance criteria that can later be verified with tests or local smoke checks.
- Identify package boundaries and expected test strategy before implementation.

## Out Of Scope For Phase 1

- Writing implementation code.
- Creating the Chrome extension package or panel UI.
- Changing package dependencies or lockfiles.
- Reworking the existing VS Code extension.
- Reworking Storybook implementation details owned by the parallel Storybook agents.
- Reworking compiler/UI/fx/virtual-module code owned by current concurrent agents.
- Publishing a Chrome Web Store package.
- Supporting Firefox/Safari extension targets unless research later justifies it.
- Building production telemetry or remote analytics.
- Inspecting arbitrary application secrets or full request bodies by default.

## Likely First Tranche

The likely first implementation tranche should prove one thin but real vertical path:

- a shared `@typed/devtools`-style protocol or internal module;
- a development-only app/runtime bridge exposed by `@typed/vite-plugin` or `@typed/app`;
- a Chrome DevTools panel that connects to the inspected Typed app;
- one view that shows Fx stream graph data, RefSubject state, or an Inferred Component tree linking both from a real fixture;
- one HMR status view showing optimized/not-optimized components and rejection reasons from compiler capability data;
- one Navigation timeline driven by `@typed/navigation` events;
- one OTEL trace visualization path using real or fixture span data;
- one Storybook or starter-based fixture proving the same protocol can be exercised without relying on a hand-built demo.

This is a hypothesis, not an approved plan.

## Explicit Non-Goals

- Do not make Chrome extension code the source of truth for Typed diagnostics.
- Do not introduce hidden filesystem routing.
- Do not build a generic React/Vue-style component inspector detached from Typed's actual runtime and compiler model.
- Do not fake Fx graphs from static imports alone if runtime subscriptions/emissions are needed.
- Do not collapse HMR eligibility into a boolean without explainable rejection reasons.
- Do not invent a trace format incompatible with OpenTelemetry trace/span identity.
- Do not duplicate VS Code virtual-module navigation in Chrome unless it serves a live-app debugging workflow.
- Do not expose env/config/API data without explicit redaction rules.
- Do not add local `declare module "typed:*"` shims in fixtures.
- Do not standardize a protocol around implementation details that should remain private.

## Phase 1 Acceptance

Phase 1 is complete. The human explicitly approved continuation on 2026-05-23.

Commit these docs and continue to strict-mode research.
