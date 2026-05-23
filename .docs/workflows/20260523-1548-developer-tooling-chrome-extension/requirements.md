# Requirements - Typed DevTools Chrome Extension

Status: approved on 2026-05-23.

## Source Grounding

- Workflow documents:
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/intent.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/scope.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/02-research.md`
- Repo surfaces:
  - `packages/fx/src/Fx/Fx.ts`
  - `packages/fx/src/RefSubject/RefSubject.ts`
  - `packages/fx/src/Fx/combinators/withSpan.ts`
  - `packages/navigation/src/Navigation.ts`
  - `packages/navigation/src/model.ts`
  - `packages/template/src/RenderTemplate.ts`
  - `packages/template/src/Render.ts`
  - `packages/template/src/compiler-runtime/dom.ts`
  - `packages/template/src/compiler-runtime/dom.test.ts`
  - `packages/compiler/src/route/analyzeRouteModule.ts`
  - `packages/compiler/src/hmr/analyzeComponentHmr.ts`
  - `packages/compiler/src/hmr/dependencies.ts`
  - `packages/compiler/src/capabilities/compileCapabilities.ts`
  - `packages/compiler/src/template/transformTemplateModule.ts`
  - `packages/compiler/src/cps/planCpsCompilation.ts`
- Durable repo references:
  - `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`
  - `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md`
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/virtual-modules/spec.md`
- External references:
  - Chrome DevTools extension docs: `https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools`
  - Chrome `devtools.panels` API: `https://developer.chrome.com/docs/extensions/reference/api/devtools/panels`
  - Chrome `devtools.inspectedWindow` API: `https://developer.chrome.com/docs/extensions/reference/api/devtools/inspectedWindow`
  - Chrome extension messaging docs: `https://developer.chrome.com/docs/extensions/mv3/messaging`
  - Chrome service-worker lifecycle docs: `https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle`
  - OpenTelemetry trace API: `https://opentelemetry.io/docs/specs/otel/trace/api`
  - OpenTelemetry overview: `https://opentelemetry.io/docs/reference/specification/overview/`
  - `jagreehal/effect-analyzer`: `https://github.com/jagreehal/effect-analyzer`
  - `effect-analyzer` docs: `https://jagreehal.github.io/effect-analyzer/`
  - Effect `effect/unstable/rpc` local skill references:
    - `.cursor/skills/effect-module-unstable-rpc/SKILL.md`
    - `.cursor/skills/effect-facet-unstable-rpc-rpc/references/api-reference.md`
    - `.cursor/skills/effect-facet-unstable-rpc-rpcgroup/references/api-reference.md`
    - `.cursor/skills/effect-facet-unstable-rpc-rpcclient/references/api-reference.md`
    - `.cursor/skills/effect-facet-unstable-rpc-rpcserver/references/api-reference.md`
    - `.cursor/skills/effect-facet-unstable-rpc-rpcserialization/references/api-reference.md`
  - Effect RPC docs via Context7: `/effect-ts/effect`, `packages/rpc/README.md`

## Functional Requirements

- FR-1: The system shall introduce `@typed/devtools-protocol` as the shared contract package for Typed DevTools facts, events, ids, schemas/codecs, redaction helpers, compatibility negotiation, and fixtures.
- FR-2: `@typed/devtools-protocol` shall define separate protocol lanes for compiler facts, runtime reactive events, HMR facts, Navigation events, OTEL trace correlation, DOM/component correlation, and source-file Analyzer requests/results.
- FR-3: The system shall stage runtime implementation behind `@typed/devtools-runtime` or an equivalent runtime boundary that owns instrumentation Layers, inspected-page bridge registration, Fx capture, RefSubject capture, and DOM registry wiring.
- FR-4: The system shall stage Chrome implementation behind `@typed/devtools-chrome` or an equivalent Chrome-specific boundary that owns the extension manifest, DevTools panel, Elements integration, Sources integration, and Chrome messaging.
- FR-5: DevTools instrumentation shall be disabled by default.
- FR-6: `typed.config.ts` shall be the primary opt-in surface for DevTools instrumentation.
- FR-7: Compiler/plugin surfaces shall provide or generate the runtime instrumentation `Layer` when DevTools instrumentation is enabled.
- FR-8: Apps shall also be able to explicitly compose the runtime instrumentation `Layer`.
- FR-9: Once enabled, supported compiler/runtime surfaces shall be instrumented automatically; users shall not need to manually wrap every component, RefSubject, or Fx stream.
- FR-10: Production builds shall omit, tree-shake, or no-op DevTools instrumentation unless an explicit diagnostic mode forces inclusion.
- FR-11: The first vertical slice shall connect Elements/Components linking and Fx/RefSubject graphing as one workflow.
- FR-12: Selecting a DOM node in Chrome Elements shall resolve, where possible, the owning Typed component, template hash, template node path or part id, source location, HMR status, related RefSubjects, and related Fx roots.
- FR-13: Clicking a component, template, RefSubject, Fx node, trace, or source Analyzer item shall deep-link to related component/source/DOM context where correlation exists.
- FR-14: DOM/component correlation shall use compiler/runtime metadata rather than DOM scraping as the primary model.
- FR-15: The runtime shall maintain a dev-only `WeakMap<Node, TypedDomBinding>` or equivalent registry for precise DOM node correlation.
- FR-16: Optional dev-only `data-typed-*` attributes may be used only as inspection aids and shall not be required for correctness.
- FR-17: Compiler instrumentation shall emit stable component ids, source locations, template hashes, template path/part metadata, HMR eligibility facts, HMR rejection reasons, component-to-RefSubject ownership, and component-to-Fx-root ownership where inferable.
- FR-18: Runtime instrumentation shall emit component/template mount and unmount events, DOM registry summaries, RefSubject snapshots/updates, Fx graph nodes/edges, Fx subscription lifetimes, Fx emissions/failures/interruptions/completions, Navigation events, and trace correlation metadata.
- FR-19: Component-owned Fx roots and RefSubject-derived streams shall be the primary first UX path.
- FR-20: Arbitrary `Fx` values created outside component ownership shall also be capturable by the core instrumentation model.
- FR-21: Arbitrary Fx capture shall support visible unowned/anonymous nodes when owner correlation is unavailable.
- FR-22: Arbitrary Fx capture shall preserve source/operator identity when compiler/runtime metadata can provide it.
- FR-23: RefSubject inspection shall show current value summaries, version, subscriber count, service id when present, owner component when known, and update history within configured retention limits.
- FR-24: RefSubject value display shall apply protocol-level serialization, size limits, and redaction rules.
- FR-25: HMR inspection shall distinguish template optimization from state-preserving HMR eligibility.
- FR-26: HMR inspection shall show which components/modules were optimized for HMR, which were not, and structured reasons why not.
- FR-27: Navigation inspection shall use `@typed/navigation` events and state as the canonical source when running inside a Typed app.
- FR-28: OTEL trace inspection shall preserve OpenTelemetry `traceId`, `spanId`, parent/child relationships, timestamps, status, attributes, links, and events.
- FR-29: Typed trace correlation shall attach Typed ids to OTEL spans instead of inventing a parallel trace model.
- FR-30: The Chrome extension shall provide a Typed DevTools panel with focused views for Components/Templates, Fx graph/timeline, RefSubject state, HMR status, Navigation, OTEL traces, and Analyzer results.
- FR-31: The Chrome extension shall integrate with the Elements panel through an Elements sidebar or selection bridge.
- FR-32: The Chrome extension shall integrate with the Sources panel through an on-demand Typed Analyzer sidebar for the active source file/range.
- FR-33: The source-file Analyzer shall require a Typed dev-server/compiler bridge for checker-backed results in the first tranche.
- FR-34: If the dev-server/compiler bridge is unavailable, the source-file Analyzer shall show an unavailable/disconnected state rather than a browser-only approximate analysis.
- FR-35: Source Analyzer requests shall identify the active file/range by DevTools resource URL, source map original path when available, module id when available, line/column, and compiler artifact version when available.
- FR-36: Source Analyzer results shall include static Effect/Fx/service/error/control-flow/layer facts where the compiler bridge can provide them.
- FR-37: Analyzer capabilities inspired by `effect-analyzer` shall be adapted to Typed compiler/runtime ids, not copied as a standalone unrelated analysis model.
- FR-38: The Chrome extension shall tolerate MV3 service-worker shutdown and reconnect behavior without losing correctness.
- FR-39: The inspected-page bridge shall send JSON-compatible summaries and ids rather than raw DOM nodes or unserializable runtime objects.
- FR-40: Storybook fixtures and protocol test fixtures shall be able to consume `@typed/devtools-protocol` without depending on Chrome extension APIs.
- FR-41: Public DevTools protocol, runtime, compiler, and extension APIs shall preserve TypeScript type safety and inference for Typed ids, protocol payloads, Layers, analyzer requests/results, and event handlers.
- FR-42: Protocol codecs and runtime bridges shall validate untrusted or cross-boundary data before exposing it as typed values.
- FR-43: DevTools communication protocols shall be defined with `effect/unstable/rpc` RPC groups and schemas rather than ad-hoc message unions.
- FR-44: `@typed/devtools-protocol` shall own the RPC group definitions for extension-panel, inspected-page runtime bridge, dev-server/compiler Analyzer bridge, and fixture/test communication.
- FR-45: Chrome-specific transports, `window.postMessage`, extension messaging, HTTP, WebSocket, and test transports shall be adapters for the shared RPC groups, not separate protocol definitions.

## Non-Functional Requirements

- NFR-1: The protocol shall be host-neutral. Compiler/runtime packages shall not depend on Chrome-specific APIs.
- NFR-2: Protocol schemas shall be versioned and support capability negotiation between app/runtime/dev-server and extension clients.
- NFR-3: DevTools instrumentation shall preserve `Fx` laziness, sharing, interruption, scope cleanup, success/error semantics, and service requirements.
- NFR-4: DevTools instrumentation shall preserve `RefSubject` semantics and shall not introduce extra user-visible emissions.
- NFR-5: Runtime event collection shall be bounded by retention limits and shall not grow without limit during long development sessions.
- NFR-6: Value serialization shall be bounded, redactable, and safe for secrets, request payloads, cookies, large objects, cyclic structures, and unserializable values.
- NFR-7: DOM correlation shall handle fragment roots, comment anchors, text/comment dynamic parts, nested ownership, list reorder, hydration replacement, and HMR node replacement.
- NFR-8: Source Analyzer results shall cache by file content hash, source map identity, compiler artifact version, and analysis options.
- NFR-9: Extension UI state shall tolerate reloads, inspected-page reloads, service-worker shutdown, and bridge reconnection.
- NFR-10: Requirements, specification, plan, and execution tasks shall preserve traceability from FR/NFR IDs to acceptance criteria and tests.
- NFR-11: Compiler/runtime instrumentation tests shall favor property/equivalence tests where practical, especially for Fx and template behavior preservation.
- NFR-12: UI controls shall be dense, work-focused, and built for repeated developer debugging rather than marketing-style presentation.
- NFR-13: Development-only globals and registries shall be namespaced, versioned, inspectable, and omitted/no-op in production by default.
- NFR-14: The first implementation shall avoid broad analyzer scope creep; source-file Analyzer is bridge-backed and on-demand.
- NFR-15: Code quality shall stay high throughout: small focused modules, small atomic functions, no broad `any`/`unknown` leakage in public contracts, deterministic tests, no duplicated protocol shapes, and no hidden framework behavior that bypasses typed surfaces.
- NFR-16: Type inference shall be an explicit design goal. Users should get inferred protocol/event/request/Layer types from the public APIs without manually threading generic parameters in common usage.
- NFR-17: Cross-package contracts shall be source-of-truth typed once in `@typed/devtools-protocol` and imported by compiler/runtime/Chrome/Storybook consumers rather than re-declared locally.
- NFR-18: Because `effect/unstable/rpc` is unstable, direct usage shall be isolated behind `@typed/devtools-protocol` and thin transport adapters; compiler/runtime/application logic shall depend on Typed protocol exports rather than unstable RPC internals.

## Acceptance Criteria

- AC-1: (maps to FR-1, FR-2, NFR-1, NFR-2) `@typed/devtools-protocol` exists with typed schemas/codecs or equivalent typed contracts for compiler facts, runtime events, DOM correlation, source Analyzer requests/results, HMR facts, Navigation events, and trace correlation.
- AC-2: (maps to FR-5 through FR-10, NFR-13) A config fixture proves DevTools instrumentation is disabled by default, enabled through `typed.config.ts`, and available as an explicit runtime `Layer`.
- AC-3: (maps to FR-11 through FR-18, NFR-7) A DOM/template fixture proves selecting or resolving a DOM node yields a component/template/source summary and related RefSubject/Fx ids without relying on DOM scraping.
- AC-4: (maps to FR-19 through FR-22, NFR-3) Fx instrumentation fixtures prove component-owned Fx roots, RefSubject-derived streams, and at least one arbitrary unowned Fx path are captured without changing stream semantics.
- AC-5: (maps to FR-23, FR-24, NFR-4, NFR-6) RefSubject fixtures prove snapshots, updates, version, subscriber count, service id, owner id, serialization limits, and redaction behavior.
- AC-6: (maps to FR-25, FR-26) HMR fixtures prove optimized-template status and state-preserving-HMR eligibility are displayed separately with structured rejection reasons.
- AC-7: (maps to FR-27) Navigation fixtures prove `@typed/navigation` events populate the Navigation timeline and deep-link to related component/source context where ids exist.
- AC-8: (maps to FR-28, FR-29) Trace fixtures prove OTEL trace/span ids and parent-child relationships are preserved while Typed correlation metadata links spans to components/Fx/RefSubjects where available.
- AC-9: (maps to FR-30, FR-31, FR-38, FR-39, NFR-9) A Chrome extension fixture or manual smoke test proves the DevTools panel and Elements integration can connect to an inspected Typed app, recover from page reload, and display JSON-compatible summaries.
- AC-10: (maps to FR-32 through FR-36, NFR-8, NFR-14) A Sources panel Analyzer fixture or manual smoke test proves active source analysis is requested through the dev-server/compiler bridge and shows an unavailable state when the bridge is missing.
- AC-11: (maps to FR-37, FR-40) Storybook or protocol fixtures prove static Analyzer-inspired facts and runtime protocol events can be rendered outside Chrome without Chrome APIs.
- AC-12: (maps to NFR-10, NFR-11) The implementation plan links each task to requirement IDs and includes semantic-preservation tests for instrumentation.
- AC-13: (maps to FR-41, FR-42, NFR-15, NFR-16, NFR-17) Type tests or equivalent compile-time fixtures prove protocol payloads, analyzer requests/results, runtime Layers, and extension bridge messages preserve inference and reject invalid shapes without broad casts.
- AC-14: (maps to FR-43, FR-44, FR-45, NFR-18) RPC fixtures prove DevTools communication is defined through shared `effect/unstable/rpc` groups and can run through at least one in-process/test transport and one browser/dev-server transport adapter without duplicating protocol shapes.

## Prioritization

- must_have:
  - FR-1 through FR-24
  - FR-25 through FR-37
  - FR-38 through FR-45
  - NFR-1 through NFR-18
  - AC-1 through AC-14
- should_have:
  - NFR-12
  - richer Analyzer diagrams after source-file bridge behavior is proven
- could_have:
  - semantic diff views inspired by `effect-analyzer`
  - trace import/export fixtures outside live app sessions
  - VS Code or CLI clients for the same protocol

## Design Decisions

### DD-1: Package Boundary

Decision: Start with a dedicated `@typed/devtools-protocol` package. Add or stage `@typed/devtools-runtime` for runtime bridge/instrumentation and `@typed/devtools-chrome` for Chrome-specific UI and DevTools API integration.

Reasoning: The protocol is shared by compiler, runtime, Vite/dev-server, Chrome extension, Storybook, tests, and future editor tooling. A host-neutral protocol package prevents drift between clients.

### DD-2: Opt-In Model

Decision: DevTools instrumentation is globally opt-in, primarily through `typed.config.ts`. Compiler/plugin surfaces provide the runtime instrumentation `Layer`, and apps can explicitly compose that Layer when desired. Once enabled, supported capture is automatic.

### DD-3: First Vertical Slice

Decision: The first vertical slice includes both Elements/Components linking and Fx/RefSubject graphing as one connected workflow.

### DD-4: Fx Capture Scope

Decision: Component-owned Fx roots and RefSubject-derived streams are the first guided UX path, but arbitrary Fx capture is a necessary protocol/runtime capability. Unowned Fx nodes are acceptable when ownership cannot be inferred.

### DD-5: Source Analyzer

Decision: Source-file Analyzer capabilities are on-demand in the Sources panel and backed by the Typed dev-server/compiler bridge. Browser-only AST approximation is not first-tranche scope.

### DD-6: Trace Model

Decision: Preserve OpenTelemetry trace/span identity and attach Typed correlation metadata. Do not define a proprietary trace model.

### DD-7: Communication Protocol

Decision: Define DevTools communication with `effect/unstable/rpc` RPC groups and schemas in `@typed/devtools-protocol`. Chrome, inspected-page, dev-server, and fixture transports adapt to those RPC groups instead of defining separate message unions.
