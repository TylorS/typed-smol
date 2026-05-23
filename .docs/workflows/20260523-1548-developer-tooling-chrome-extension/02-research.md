## Research Questions

1. What must the Chrome DevTools panel architecture look like under current Manifest V3 and DevTools API constraints?
2. Which current Typed compiler/runtime surfaces can already provide facts for `Fx`, `RefSubject`, HMR, Navigation, and traces?
3. Where does the repo lack instrumentation metadata and therefore need compiler/runtime changes?
4. What external evidence supports graph/timeline visualization for reactive debugging?
5. How should OpenTelemetry trace/span data fit the Typed-specific tooling protocol?
6. How should Typed connect inferred components to concrete DOM nodes in Chrome's Elements tab?
7. How should static analyzer capabilities appear on-demand while looking at source files in DevTools?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| `AGENTS.md` | 2026 | repo policy | high | Strict + merge workflow, stage order, fresh workflow ownership, and approval gates. |
| `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md` | 2026 | accepted/proposed repo ADR | high | HMR state preservation is narrower than template optimization and should favor `RefSubject.Service` identity. |
| `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md` | 2026 | proposed repo ADR | high | Diagnostics should be shared across CLI, Vite, TS plugin, VS Code, and future browser tooling. |
| `packages/fx/src/Fx/Fx.ts` | current workspace | code | high | `Fx` is executable via `run(sink)` and does not currently expose a graph model by itself. |
| `packages/fx/src/RefSubject/RefSubject.ts` | current workspace | code | high | `RefSubject` exposes observable mutable state with version and subscriber count, plus service-backed identities. |
| `packages/compiler/src/route/analyzeRouteModule.ts` | current workspace | code | high | Existing compiler analysis detects `RefSubject.Service`, inline RefSubject-like state, templates, closures, and `@typed/ui` stateful components. |
| `packages/compiler/src/hmr/analyzeComponentHmr.ts` | current workspace | code | high | Current HMR analysis reports route/dependency/template boundary and service descriptors. |
| `packages/compiler/src/hmr/dependencies.ts` | current workspace | code | high | Dependency HMR facts include participant reasons and rejection reasons such as anonymous state or explicit opt-out. |
| `packages/compiler/src/capabilities/compileCapabilities.ts` | current workspace | code | high | Separates optimized template capabilities from stateful-HMR eligibility, services, dependencies, and rejections. |
| `packages/template/src/compiler-runtime/dom.ts` | current workspace | code | high | Compiled DOM templates already instantiate static HTML by `templateHash`, mount dynamic bindings, and resolve nodes via stable child paths. |
| `packages/template/src/compiler-runtime/dom.test.ts` | current workspace | code | high | Confirms generated DOM templates bind dynamic node parts by `getElementAtPath`, `getCommentAtPath`, and `bindNode`. |
| `packages/compiler/src/template/transformTemplateModule.ts` | current workspace | code | high | Generated DOM template declarations emit `templateHash`, static HTML, path-based bind calls, and HMR support. |
| `packages/compiler/src/cps/planCpsCompilation.ts` | current workspace | code | medium-high | Continuation ids already combine module id, template hash, target, HMR service ids, and closure facts. |
| `packages/navigation/src/Navigation.ts` and `packages/navigation/src/model.ts` | current workspace | code | high | Navigation has reactive state, typed actions, before/after hooks, transitions, and Schema-backed event models. |
| `packages/fx/src/Fx/combinators/withSpan.ts` | current workspace | code | medium-high | Existing `Fx.withSpan` bridges stream execution and sink outcomes to Effect spans. |
| Chrome "Extend DevTools" docs, https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools | current docs | official docs | high | DevTools APIs live in `devtools_page`; DevTools pages can create panels, inspect the target page, and communicate with service workers/content scripts. |
| Chrome `devtools.panels` API, https://developer.chrome.com/docs/extensions/reference/api/devtools/panels | current docs | official docs | high | `chrome.devtools.panels.create(title, iconPath, pagePath, callback)` creates a panel; the API exposes Elements and Sources sidebars, `openResource`, and resource-open handlers. |
| Chrome `devtools.inspectedWindow` API, https://developer.chrome.com/docs/extensions/reference/api/devtools/inspectedWindow | current docs | official docs | high | DevTools extensions can evaluate code in the inspected page and that context includes console APIs such as `inspect` and `$0`; returned values must be JSON-compatible. |
| Chrome extension messaging docs, https://developer.chrome.com/docs/extensions/mv3/messaging | current docs | official docs | high | DevTools extensions currently need `chrome.*`; Promise message listener behavior is disabled for DevTools extensions. |
| Chrome service worker lifecycle docs, https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle | current docs | official docs | high | MV3 service workers terminate after idle/request limits; state must not rely on globals. |
| OpenTelemetry Tracing API, https://opentelemetry.io/docs/specs/otel/trace/api | current spec | official specification | high | Spans are trace tree nodes with trace/span ids, parent context, timing, attributes, links, events, and status. |
| OpenTelemetry overview, https://opentelemetry.io/docs/reference/specification/overview/ | current spec | official specification | high | A trace can be treated as a DAG of spans connected by parent/child relationships. |
| `jagreehal/effect-analyzer`, https://github.com/jagreehal/effect-analyzer | 2026 | external project | medium | Useful inspiration for static Effect analysis, semantic diagrams, complexity metrics, semantic diffs, and HTML viewers; not a design constraint. |
| `effect-analyzer` docs, https://jagreehal.github.io/effect-analyzer/ | 2026 | external project docs | medium | Shows a docs/playground-oriented presentation for services, errors, paths, decision points, concurrency, and semantic drift. |
| Banken, Meijer, Gousios, "Debugging Data Flows in Reactive Programs", ICSE 2018 | 2018 | peer-reviewed paper | medium-high | RxFiddle visualizes reactive data-flow dependencies and values; reported faster debugging in a 111-developer experiment. |
| Hoffswell, Satyanarayan, Heer, "Visual Debugging Techniques for Reactive Data Visualization", EuroVis 2016 | 2016 | peer-reviewed paper | medium | Supports timeline/replay/state-update visualization for reactive systems; domain is visualization specs, not app frameworks. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `Chrome DevTools extension panel messaging Manifest V3 official docs` | Verify current Chrome extension architecture, panel creation, and messaging constraints. | Chrome Extend DevTools, Chrome `devtools.panels`, Chrome messaging, Chrome service-worker lifecycle. |
| `OpenTelemetry trace visualization waterfall span tree official docs` | Verify trace/span model and visualization vocabulary from official sources. | OpenTelemetry Tracing API, OpenTelemetry overview, OpenTelemetry observability primer. |
| `reactive programming stream visualization debugging paper event streams graph` | Find peer-reviewed evidence for graph/timeline debugging of reactive systems. | RxFiddle / "Debugging Data Flows in Reactive Programs"; "Visual Debugging Techniques for Reactive Data Visualization". |
| `RxFiddle visualizing RxJava event streams paper` | Verify RxFiddle metadata and experiment claim from a primary/near-primary source. | TU Delft research portal and ACM DOI record. |
| `jagreehal/effect-analyzer Effect static analysis diagrams` | Evaluate user-provided inspiration source for additional capabilities. | GitHub README and published docs site. |
| `Chrome DevTools inspectedWindow $0 inspect official docs` | Verify feasibility of selecting or correlating DOM nodes from DevTools context. | Chrome `devtools.inspectedWindow` API. |
| `Chrome DevTools Sources panel extension sidebar official docs` | Verify whether source-file contextual analyzer UI can live in DevTools. | Chrome `devtools.panels.sources.createSidebarPane`, `openResource`, and `setOpenResourceHandler`. |

## Key Findings

### Chrome DevTools Panel Architecture

- The browser surface should be a real DevTools panel, created from a `devtools_page` via `chrome.devtools.panels.create(...)`.
- DevTools-specific APIs are only available to pages loaded inside DevTools. Content scripts and normal extension pages cannot directly use `chrome.devtools.*`.
- Chrome's current DevTools-extension behavior requires using `chrome.*`; the `browser` namespace and promise-style message listener changes are disabled for extensions that declare `devtools_page`.
- MV3 service workers are not a stable in-memory event bus. They can terminate after inactivity or long-running work, so durable session state should live in the inspected page bridge, panel state, or explicit storage, not service-worker globals.
- Injected page scripts cannot send extension runtime messages directly. Chrome recommends a content script intermediary plus `window.postMessage()` when page-context code must communicate with the extension.

### Elements Tab And Component-DOM Correlation

- The Elements panel should be treated as a first-class navigational surface, not merely a passive DOM viewer.
- Current compiled DOM template work gives Typed a useful anchor:
  - `defineDomTemplate` takes a `templateHash`;
  - generated templates mount static HTML and dynamic bindings from compiler-known node/comment paths;
  - template transforms already emit `getElementAtPath(...)`, `getCommentAtPath(...)`, and binding calls;
  - CPS continuation ids already combine module ids with template hashes and HMR/service facts.
- This suggests the most durable component-to-DOM model is compiler/runtime correlation, not DOM scraping:
  - compiler emits stable component ids, template ids, source spans, and template path metadata;
  - DOM runtime registers mounted roots, elements, comments, and dynamic parts into a dev-only registry;
  - DevTools resolves selected Elements-panel nodes back to Typed ids through the inspected-page bridge;
  - Typed panel tabs deep-link by stable ids instead of by fragile CSS selectors.
- There are two likely DOM identification layers:
  - a `WeakMap<Node, TypedDomBinding>` registry for precise runtime correlation without permanent DOM markup;
  - optional dev-only `data-typed-*` attributes on element roots where they make inspection easier and do not leak into production output.
- Chrome's `devtools.inspectedWindow.eval` can access inspected-page JavaScript state and console helpers such as `$0`, so the extension can query the current selected DOM node. The result sent back to the panel must be JSON-compatible, so the page bridge should return Typed ids and summaries, not raw nodes.
- The component graph must support one component mapping to many DOM nodes, one DOM subtree containing nested component ownership, fragment roots with comment anchors, text/comment dynamic parts, list reordering, hydration replacement, and HMR node replacement.
- The intuitive user flow should be bidirectional:
  - select a DOM node in Elements, see the owning Typed component, template, state, Fx roots, HMR status, and recent traces;
  - click a component/state/Fx/trace item in the Typed panel, reveal or inspect the relevant DOM node when available.
- User decision: the first vertical slice should include both Elements/Components linking and Fx/RefSubject graphing. These should ship as a connected workflow, not as unrelated panels.

### Reactive Runtime Instrumentation

- `Fx` is currently an executable stream abstraction: `Fx<A, E, R>` runs by receiving a `Sink<A, E, R>`. That shape is good for wrapping/instrumenting execution, but it does not inherently retain graph topology, source identity, operator identity, or parent/child relationships.
- `RefSubject` already has observable-state affordances that map well to a panel:
  - sample current value through the Effect-yieldable surface;
  - observe values as `Fx`;
  - inspect `version`;
  - inspect `subscriberCount`;
  - use service ids through `RefSubject.Service(...)`.
- Therefore, truthful Fx graphs and RefSubject ownership will require explicit instrumentation, likely in a combination of:
  - compiler output or transforms that attach stable source/component/operator ids;
  - `@typed/fx` wrappers around selected constructors/combinators/run paths;
  - `RefSubject` creation/update instrumentation;
  - app/runtime bridge registration for dev mode.
- User decision: component-owned Fx roots and RefSubject-derived streams are the first guided workflow, but arbitrary `Fx` values created elsewhere in the app must also be capturable by the core instrumentation model.
- This implies two capture modes:
  - inferred ownership, where compiler/runtime facts attach Fx nodes to components, templates, routes, RefSubjects, or services;
  - ambient runtime capture, where instrumented Fx constructors/combinators/runs register source identity and graph relationships even without a component owner.
- User decision: devtools instrumentation is opt-in at the app/tooling level, but once enabled, supported Fx capture is automatic rather than manually wrapping every stream.
- User decision: `typed.config.ts` is the primary opt-in surface. Compiler/plugin surfaces should then provide the runtime `Layer`; explicitly composing that Layer remains the manual opt-in path.
- User decision: the long-term package boundary should start with a dedicated `@typed/devtools-protocol` package, followed by runtime and Chrome-specific packages as the surface matures.
- Recommended package split:
  - `@typed/devtools-protocol` owns schemas, ids, event contracts, compatibility negotiation, serialization/redaction helpers, and fixtures;
  - `@typed/devtools-runtime` owns runtime bridge, Layers, Fx and RefSubject instrumentation wiring;
  - `@typed/devtools-chrome` owns the Chrome extension, panel UI, Elements/Sources sidebars, and DevTools API integration.

### Compiler And HMR Facts

- Current compiler analysis already detects several useful facts:
  - RefSubject services;
  - inline RefSubject-producing state;
  - template facts;
  - closure captures;
  - `@typed/ui` stateful component imports and `makeState` calls.
- `analyzeComponentHmr` reports HMR eligibility based on route/dependency/template boundary and discovered services. This is a good seed for the DevTools "optimized for HMR" view.
- `analyzeDependencyHmr` already records dependency participants and rejection reasons. Current reasons include:
  - `anonymous-refsubject-state`;
  - `explicit-opt-out`.
- `planCompileCapabilities` already separates optimized template capabilities from HMR eligibility. This is important: DevTools must not imply that optimized output means safe state-preserving HMR.
- Gaps:
  - Not every non-eligible component currently has a full human-readable reason.
  - The panel will need source positions, stable component ids, and correlation ids to connect compiler facts to runtime state.
  - HMR explanation likely needs an explicit "why not" diagnostic taxonomy beyond current narrow rejection cases.

### Navigation Facts

- `@typed/navigation` is already a strong source for the Navigation timeline:
  - reactive `currentEntry`, `entries`, `transition`, `canGoBack`, `canGoForward`;
  - typed actions: `navigate`, `back`, `forward`, `traverseTo`, `updateCurrentEntry`, `reload`;
  - lifecycle hooks: `onBeforeNavigation`, `onNavigation`;
  - Schema-backed models for `Destination`, `Transition`, `BeforeNavigationEvent`, and `NavigationEvent`.
- The panel should prefer these framework events over raw browser history events when running inside a Typed app. Browser history can be a secondary sanity source, not the canonical route model.

### OTEL And Trace Correlation

- OpenTelemetry should remain the canonical trace model. The Typed tooling protocol should carry trace/span ids and attach Typed correlation metadata rather than defining a parallel trace format.
- The existing `Fx.withSpan` combinator proves an existing path from Fx execution to Effect spans, but the first design pass must decide whether DevTools receives spans from:
  - Effect unstable observability/OTLP exporter surfaces;
  - a dev-only local collector/exporter bridge;
  - browser instrumentation;
  - fixture/imported payloads for early UI acceptance.
- The panel should render trace data in at least two shapes:
  - tree/DAG by parent-child span relationships;
  - waterfall/timeline by start/end timestamps.

### Research Evidence For Reactive Visualization

- RxFiddle supports the basic premise that reactive data-flow debugging benefits from visualizing both dependency structure and values in the flow. The paper's scope is Rx/RxJava rather than Typed Fx, but the problem framing maps closely to `Fx` graph introspection.
- Vega visual debugging supports a timeline-first model for reactive systems: input events, variable updates, replay/step-through, and in-context annotations. The domain differs, but the design implication is relevant for Navigation events, RefSubject updates, and trace timelines.

### Effect Analyzer Inspiration

- `effect-analyzer` is relevant because it extracts semantic structure from Effect programs without runtime execution and turns that structure into diagrams, metrics, diffs, and interactive HTML.
- The most transferable capabilities are:
  - static service dependency maps;
  - error channel and handling topology;
  - concurrency and control-flow diagrams;
  - layer composition views;
  - complexity metrics and thresholds;
  - semantic diffs that explain behavior drift beyond text diffs;
  - source-linked static analysis artifacts that can be shown in docs, CI, Storybook, or DevTools.
- Typed should adapt those ideas through its compiler and runtime boundaries:
  - static "Analyzer" facts can come from compiler/virtual-module analysis;
  - live graph/state/timeline facts should come from the runtime bridge;
  - both should share ids so a static service node can deep-link to runtime RefSubject, Fx, HMR, DOM, and trace views where correlation exists.
- This should not replace Typed-specific instrumentation. `effect-analyzer` focuses on static Effect program shape, while the Chrome extension needs live inspected-page events, DOM selection, HMR state, Navigation history, and OTEL trace correlation.

### Source-File On-Demand Analyzer

- Static Analyzer views should be available on demand while a developer is looking at a source file in DevTools, not just as a standalone tab.
- Chrome exposes a Sources panel sidebar extension surface through `chrome.devtools.panels.sources.createSidebarPane(...)`, so Typed can add a compact "Typed Analyzer" sidebar next to the currently selected source.
- Chrome also exposes `chrome.devtools.panels.openResource(...)` and `setOpenResourceHandler(...)`, so Typed can deep-link from any graph/state/trace node back to the source URL, line, and column, and can intercept resource-open requests where appropriate.
- The analyzer should run against source identity, not inspected-page runtime objects:
  - resource URL;
  - source map original path when available;
  - module id;
  - line/column or selected symbol range;
  - compiler artifact ids for components, templates, services, HMR, and closures.
- On-demand behavior should be lazy and bounded:
  - analyze the active source only after user intent or sidebar visibility;
  - cache by file content hash, source map identity, and compiler artifact version;
  - show partial results when type-checker-backed analysis is unavailable;
  - never block live runtime event collection.
- User decision: the first source-file Analyzer should require the Typed dev-server/compiler bridge for checker-backed results. Browser-only AST analysis is not a first-tranche requirement.
- This makes the static Analyzer a contextual lens:
  - source file -> static Effect/Fx/service/error/control-flow/layer facts;
  - static fact -> runtime component/RefSubject/Fx/HMR/trace facts when ids correlate;
  - runtime issue -> source file and Analyzer explanation.

## Open Risks and Unknowns

- The current dirty worktree includes concurrent work in `packages/compiler`, `packages/fx`, `packages/app`, `packages/ui`, Storybook, and RealWorld. Research reflects current visible files but exact APIs may change before implementation starts.
- The cost of instrumenting all Fx operators may be too high. Requirements should distinguish mandatory first-tranche operators/constructors from broad long-tail support.
- Arbitrary Fx capture needs source/operator identity without assuming component ownership. Requirements should define what is mandatory for the first tranche and what falls back to anonymous-but-visible nodes.
- Runtime graph metadata can change semantics if wrappers alter laziness, sharing, scope, interruption, or error behavior. Property/equivalence tests should guard this.
- RefSubject value display needs explicit serialization and redaction. Raw values may include secrets, cookies, request payloads, or large objects.
- HMR status needs a stable taxonomy. Current compiler facts are a seed, not a complete explainability model.
- OTEL bridge choice remains open. A local OTLP collector path may be more standards-aligned, while fixture/imported span payloads may be faster for first UI acceptance.
- Chrome DevTools extension lifecycle and messaging constraints mean the panel should tolerate reconnects and missed service-worker state.
- Elements integration must avoid production markup bloat and data leakage. Runtime registries should be preferred, with dev-only DOM attributes reserved for inspectability.
- Node correlation must handle fragments, comment anchors, text-only dynamic parts, portals or external mount points if added later, hydration mismatch, list reorders, and HMR replacement.
- `devtools.inspectedWindow.eval` is powerful and page-controlled. The bridge should validate and serialize only small, typed summaries.
- Source-file analysis depends on sourcemaps and Vite/dev-server resource identity. Requirements must decide how much degraded behavior is acceptable when only generated JavaScript is available.
- Static analysis may require the TypeScript checker and compiler artifacts that are not present in the browser. The first tranche should use a dev-server/compiler-side analyzer endpoint rather than doing analysis inside the extension.

## Implications for Requirements and Specification

- Requirements must include a shared Typed devtools protocol with at least five event/fact lanes:
  - compiler facts;
  - runtime reactive events;
  - navigation events;
  - HMR capability/rejection facts;
  - trace/span payloads.
- Requirements should place protocol schemas and fixtures in `@typed/devtools-protocol` so compiler, runtime, Vite/dev-server, Chrome extension, Storybook, tests, and future editor tooling share the same contract.
- Requirements must include a cross-tab deep-link protocol keyed by stable Typed ids:
  - `componentId`;
  - `templateHash` plus template node path or part id;
  - DOM binding id or registry handle;
  - `fxNodeId`;
  - `refSubjectId`;
  - HMR boundary/service ids;
  - Navigation event id;
  - OTEL `traceId` and `spanId`.
- Requirements should define at least these product tabs/surfaces:
  - Elements integration sidebar/selection bridge;
  - Components and templates;
  - Fx graph and event timeline;
  - RefSubject/state inspector;
  - HMR status and rejection reasons;
  - Navigation timeline;
  - OTEL traces;
  - static Analyzer views inspired by `effect-analyzer`, including on-demand source-file sidebars.
- Requirements should define source-file Analyzer behavior:
  - how DevTools resource URL, source map path, module id, and selected range map to compiler artifacts;
  - how the extension reports "compiler bridge unavailable" instead of falling back to approximate AST-only analysis;
  - how results cache and invalidate during HMR;
  - how source Analyzer nodes deep-link to live runtime tabs;
  - how runtime tabs open source locations through DevTools resource APIs.
- Requirements must explicitly define what compiler instrumentation does:
  - stable ids for inferred components;
  - source locations;
  - HMR eligibility and rejection reasons;
  - component-to-RefSubject ownership;
  - component-to-Fx graph roots where inferable;
  - component-to-template and template-path metadata for DOM correlation.
- Requirements must explicitly define what runtime instrumentation does:
  - component and template mount/unmount events;
  - DOM node registry summaries for selected nodes;
  - Fx graph nodes and edges;
  - arbitrary Fx capture for instrumented constructors/combinators/runs;
  - stream subscriptions and lifetimes;
  - emissions/failures/interruptions/completions;
  - RefSubject snapshots and updates;
  - Navigation events and transitions;
  - trace correlation metadata.
- The first vertical slice should not be "Chrome panel only". It should include:
  - a protocol package or internal module;
  - compiler/runtime instrumentation for one real component/route flow;
  - Elements/Components selection that resolves a DOM node to the owning Typed component/template;
  - RefSubject state and Fx graph roots reachable from that component;
  - graph nodes that deep-link back to component/source/DOM context;
  - a panel client that renders those facts.
- The spec should reserve production behavior as opt-in/off-by-default. Dev instrumentation should be development-only and should fail closed or no-op in production builds.
- Requirements should define the opt-in control surface for devtools instrumentation:
  - disabled by default;
  - primarily enabled through `typed.config.ts`;
  - compiler/plugin surfaces generate or expose the runtime instrumentation `Layer`;
  - explicit runtime `Layer` composition is supported for manual app-level opt-in;
  - once enabled, compiler/runtime instrumentation automatically captures supported component, RefSubject, and Fx facts;
  - production builds omit or no-op instrumentation unless explicitly forced for diagnostics.
- The spec should define trace compatibility in OpenTelemetry terms and avoid proprietary trace ids.

## Alignment Notes

- specs_alignment:
  - Aligns with `.docs/specs/typed-framework-starter/spec.md`: the panel should inspect explicit `typed:server`, `typed:browser`, `typed:config`, `typed:env`, router, and app-mode surfaces rather than hidden framework ownership.
  - Aligns with `.docs/specs/virtual-modules/spec.md`: generated virtual-module facts should be shared through existing compiler/virtual-module infrastructure where possible.
- adrs_alignment:
  - Aligns with `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`: DevTools should show explicit virtual-module boundaries instead of adding filesystem routing.
  - Aligns with `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`: compiler facts and diagnostics should reuse artifact/cross-surface contracts rather than recomputing per host.
  - Aligns with `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`: DevTools must distinguish template optimization from state-preserving HMR.
  - Aligns with `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md`: shared diagnostics should feed the panel instead of panel-specific diagnostic strings.
- workflows_alignment:
  - Builds on `.docs/workflows/20260522-2049-storybook-framework-integration/`: Storybook can provide deterministic fixtures for panel/protocol acceptance.
  - Builds on `.docs/workflows/20260522-2104-serializable-template-tooling/`: compiler/runtime boundaries and diagnostics are central to the instrumentation plan.

## Memory Promotion Candidates

- procedural: For Typed DevTools work, start from compiler/runtime instrumentation and a shared protocol before panel UI. Confidence: high.
- heuristic: Never equate optimized template output with state-preserving HMR eligibility; require separate status and rejection reasons. Confidence: high.
- heuristic: For reactive DevTools, show both graph structure and timeline/value events; external reactive-debugging literature supports both. Confidence: medium-high.
- heuristic: Preserve OpenTelemetry trace/span identity and add Typed correlation metadata instead of inventing a trace model. Confidence: high.
- product-shape: Make Elements-tab component linking first-class and bidirectional. Use compiler ids plus a runtime WeakMap registry as the primary correlation mechanism; dev-only `data-typed-*` attributes are optional inspection aids. Confidence: high.
- heuristic: Treat `effect-analyzer` as inspiration for static analyzer views, semantic diffs, and complexity/service/error diagrams, but keep Typed DevTools grounded in live runtime protocol events. Confidence: medium-high.
- product-shape: Static Analyzer capabilities should be lazy source-file context in the Sources panel plus deep links from runtime tabs, not an always-on replacement for live instrumentation. Confidence: high.
- product-shape: The first vertical slice should cover both Elements/Components linking and Fx/RefSubject graphing as one connected workflow. Confidence: high.
- product-shape: Prioritize component-owned Fx and RefSubject-derived streams in the first UX path, but design the protocol/runtime instrumentation so arbitrary Fx values are capturable too. Confidence: high.
- product-shape: DevTools instrumentation is globally opt-in, then automatic for supported runtime/compiler surfaces once enabled. Confidence: high.
- product-shape: `typed.config.ts` is the main DevTools opt-in, and compiler surfaces should provide the instrumentation Layer for explicit composition. Confidence: high.
- product-shape: Start with a dedicated `@typed/devtools-protocol` package, then layer `@typed/devtools-runtime` and `@typed/devtools-chrome` around it. Confidence: high.
