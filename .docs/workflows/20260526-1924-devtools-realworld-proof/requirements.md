# Requirements - DevTools RealWorld End-To-End Proof

Status: approved on 2026-05-26 after production-grade review.

## Functional Requirements

- FR-1: RealWorld must provide an explicit devtools smoke mode that enables the generated browser runtime bridge without enabling devtools in the default app build.
- FR-2: The generated RealWorld browser runtime must create one enabled `DevtoolsRuntimeService` and share it across DOM registry, runtime bridge, and runtime event replay.
- FR-3: The RealWorld app bridge handshake must advertise only capabilities the inspected runtime can actually serve.
- FR-4: The Chrome panel must render live inspected RealWorld runtime data when connected and must render explicit unavailable or empty states when a capability is not wired.
- FR-5: Fixture-backed panel data must not count as proof for RealWorld Components, Fx, RefSubjects, HMR, Navigation, OTEL, DOM, or Sources functionality.
- FR-6: RealWorld component/template mount events must appear in the runtime event stream and populate the component tree.
- FR-7: DOM deep links must resolve from a mounted RealWorld DOM binding to its owning component/template when the DOM registry has a binding.
- FR-8: Source deep links must resolve through compiler/source facts to an exact RealWorld resource, line, and column in production-grade completion. Source-analyzer unavailable is an intermediate diagnostic state only.
- FR-9: At least one RealWorld Fx path must emit live `FxNodeEvent` data through the runtime stream.
- FR-10: If full Fx topology is unavailable, the UI and docs must distinguish event capture from graph topology support.
- FR-11: At least one RealWorld RefSubject path must emit snapshot or update data with id, version, value summary, and subscriber count when available.
- FR-12: RefSubject and Fx value payloads crossing the bridge must use bounded protocol serialization/redaction helpers.
- FR-13: RealWorld HMR proof must distinguish template optimization from state-preserving HMR eligibility.
- FR-14: HMR rejection reasons must remain structured and visible in protocol data and panel output.
- FR-15: RealWorld Navigation events must appear in the runtime event stream and panel after real route transitions.
- FR-16: Navigation events must preserve at least navigation type and destination URL, and add richer transition fields only when the canonical navigation surface exposes them.
- FR-17: OTEL proof must render span data with trace id, span id, span name, and Typed correlation ids when available.
- FR-18: OTEL requirements and implementation must preserve OpenTelemetry trace/span identity rather than replacing it with a Typed-only trace format.
- FR-19: Any compiler capability missing from RealWorld proof must be documented as a precise dependency with the missing fact/event/id and the smallest reproducing command or interaction.
- FR-20: The proof must include runnable local commands or browser automation steps for RealWorld devtools startup, interaction, and assertion.
- FR-21: Production-grade completion must require live RealWorld proof for Components, DOM links, Source links, Fx, RefSubjects, HMR, Navigation, and OTEL. A documented blocker is evidence for replanning, not acceptance.
- FR-22: The runtime event protocol must include enough data to render a real Fx graph, not only a flat Fx event table: stable node ids, labels, owner ids, parent/child or producer/consumer edges, lifecycle phase, timestamps, and last value/error summaries.
- FR-23: Component tree rows must include stable component id, display name, source location when available, template hash when available, DOM binding ids, owned Fx node ids, owned RefSubject ids, and HMR boundary id when available.
- FR-24: Source deep links must open the exact RealWorld source resource and line through Chrome DevTools or an automated equivalent; source-analyzer unavailable is a failure for production-grade completion.
- FR-25: RefSubject state rows must include stable id, owner/service identity when available, current value summary, version, subscriber count, update timestamp, and bounded update history.
- FR-26: HMR rows must include boundary id, module id, template optimization status, stateful-HMR status, service ids when eligible, structured rejection reasons when rejected, and update timestamp.
- FR-27: Navigation rows must include event id, type, origin URL when available, destination URL, committed/current entry id when available, timestamp, and correlation ids to route/component/Fx/RefSubject/OTEL data when available.
- FR-28: OTEL rows must include trace id, span id, parent span id when available, span name, start time, duration or end time, status, attributes summary, events count, links count, and Typed correlation ids.
- FR-29: The panel must render first-class views for Component Tree, Fx Graph, RefSubject States, HMR, Navigation, OTEL, and Sources. A generic event list is not sufficient for production-grade completion.
- FR-30: The RealWorld smoke must exercise a deterministic scripted scenario that triggers all required lanes in one run or a documented sequence of runs.
- FR-31: The final proof must run against the built Chrome extension panel or a browser automation harness that uses the same panel code and inspected-window bridge. Unit-only and fixture-only proof is insufficient.
- FR-32: The final proof must include reload/reconnect behavior: initial connect, page reload, panel replay after reconnect, and no stale fixture state after reconnect.
- FR-33: The devtools bridge must reject invalid protocol payloads and tolerate bridge exceptions without crashing the inspected RealWorld app.
- FR-34: Production-grade completion must include at least one negative test proving devtools-disabled RealWorld exposes no `__TYPED_DEVTOOLS__` bridge.
- FR-35: Production-grade completion must include a release checklist for extension artifact completeness: manifest, devtools page, panel assets, background/service worker, and load-unpacked smoke instructions or automation.

## Non-Functional Requirements

- NFR-1: Devtools instrumentation must remain development-only and opt-in.
- NFR-2: Default RealWorld `check`, `build`, and presentation tests must continue to prove devtools is not enabled by default.
- NFR-3: Runtime instrumentation must be diagnostic-only and must not alter Fx laziness, interruption, success/failure semantics, RefSubject update semantics, router behavior, or app layering.
- NFR-4: Chrome-specific APIs must remain inside `@typed/devtools-chrome`; protocol and runtime packages must stay Chrome-neutral.
- NFR-5: Cross-boundary payloads must be schema-validated at the protocol/bridge boundary.
- NFR-6: The panel must not imply support for a capability that the handshake did not accept.
- NFR-7: The first implementation must prioritize truthful data and unavailable states over visual redesign.
- NFR-8: RealWorld proof must use generated app/runtime paths rather than bespoke app-only mocks.
- NFR-9: The workflow must not revert or absorb unrelated concurrent edits in the dirty checkout.
- NFR-10: Compiler-owned gaps must be coordinated with the parallel compiler-capability agent unless the human explicitly expands this workflow's ownership.
- NFR-11: Tests should be focused and fail before implementation during Phase 4.
- NFR-12: RealWorld acceptance claims must name any environment blockers, including missing `hurl`, instead of treating blocked gates as passing.
- NFR-13: Workflow memory must capture stable proof commands, blockers, and cross-agent dependency facts before each task commit.
- NFR-14: All requested capabilities are P0 for this workflow. None may remain `should_have` or `could_have` at finalization.
- NFR-15: Production-grade acceptance requires deterministic automation where feasible; any manual smoke is a temporary supplement and must have exact click/path/assertion steps.
- NFR-16: Runtime capture overhead in devtools mode must be bounded by retention limits and must not create unbounded event/value history.
- NFR-17: Redaction and serialization limits must apply before data leaves the inspected page.
- NFR-18: Capability negotiation must be fail-closed: unsupported or failed capabilities render unavailable states and must not silently emit partial fake data.
- NFR-19: Browser/Chrome-specific behavior must be tested at the Chrome boundary or explicitly documented with a manual load-unpacked smoke until automation exists.
- NFR-20: Every task must name exact files, tests, commands, expected failures, and expected passing outputs before implementation begins.

## Acceptance Criteria

- AC-1: A RealWorld devtools smoke mode can be invoked by a documented command or environment flag and generated browser source contains the devtools bridge only in that mode. Maps to FR-1, FR-2, NFR-1, NFR-2, NFR-8.
- AC-2: A runtime/bridge test proves one `DevtoolsRuntimeService` event bus is shared by DOM registry, bridge handshake, and event replay. Maps to FR-2, FR-3, NFR-3.
- AC-3: A panel or inspected-window smoke connects to RealWorld, reports `runtime connected`, and receives no fixture-only runtime rows. Maps to FR-4, FR-5, NFR-6, NFR-7.
- AC-4: RealWorld component/template mount data appears in the panel component tree after hydration. Maps to FR-6, NFR-8.
- AC-5: A mounted RealWorld DOM binding can be inspected or resolved to its component/template. Maps to FR-7, FR-19.
- AC-6: Source action output opens or resolves a RealWorld source target from compiler/source facts with no fabricated browser-only analysis. Maps to FR-8, FR-19, NFR-4.
- AC-7: A RealWorld interaction emits a live Fx graph with at least two connected nodes or a single node with an explicit no-edge reason rooted in real runtime topology. Maps to FR-9, FR-10, FR-21, FR-22, NFR-3.
- AC-8: A RealWorld interaction emits at least one RefSubject snapshot and one update row with value summary, version, and timestamp. Maps to FR-11, FR-12, FR-21, FR-25.
- AC-9: RealWorld HMR proof shows template optimization separately from stateful-HMR status and rejection reasons. Maps to FR-13, FR-14.
- AC-10: RealWorld route transitions emit Navigation rows in the panel. Maps to FR-15, FR-16.
- AC-11: OTEL rows render at least one trace with parent/child span identity, timing, status, attributes summary, and at least one Typed correlation id from RealWorld. Maps to FR-17, FR-18, FR-21, FR-28.
- AC-12: Local proof instructions list commands, ports, browser/extension setup, expected visible rows, and known environment blockers. Maps to FR-20, NFR-12, NFR-13.
- AC-13: Every Phase 4 task links back to one or more FR/NFR ids and updates workflow memory before commit. Maps to NFR-11, NFR-13.
- AC-14: The panel has distinct views for Component Tree, Fx Graph, RefSubject States, HMR, Navigation, OTEL, and Sources, and each view is populated by live RealWorld data in final proof. Maps to FR-21, FR-29.
- AC-15: The RealWorld smoke runs a deterministic scenario that triggers every required capability lane and fails if any lane is absent. Maps to FR-30, NFR-15.
- AC-16: Chrome extension artifact smoke loads the built extension or equivalent panel harness and proves connect, reload, replay, and no stale fixture state. Maps to FR-31, FR-32, FR-35, NFR-19.
- AC-17: Invalid bridge payload tests fail closed and do not crash RealWorld. Maps to FR-33, NFR-18.
- AC-18: Devtools-disabled RealWorld exposes no `__TYPED_DEVTOOLS__` bridge. Maps to FR-34, NFR-1, NFR-2.
- AC-19: Final plan tasks name exact file paths, tests, commands, expected failing output, and expected passing output. Maps to NFR-20.

## Prioritization

- must_have:
  - FR-1 through FR-35
  - NFR-1 through NFR-20
  - AC-1 through AC-19
- should_have:
  - none for production-grade completion
- could_have:
  - richer Navigation transition details beyond type and destination
  - additional visual polish after truthful live data is complete

## Research Notes

- Chrome DevTools extensions run a DevTools page while DevTools is open; that page can create panels and use `devtools.inspectedWindow`.
- Chrome `devtools.inspectedWindow.eval()` can evaluate code in the inspected page and access selected element helpers such as `$0`, but evaluated page code cannot directly message the DevTools page without an intermediary.
- Chrome DevTools extension docs currently require `chrome.*` APIs for extensions declaring `devtools_page`.
- OpenTelemetry models traces as spans with trace/span identity, attributes, events, links, and status; Typed correlation must attach to that model rather than replace it.
- OpenTelemetry JavaScript browser work should keep the trace source explicit because browser instrumentation and collector/exporter choices affect what can be proven locally.

## Approval Gate

Does `requirements.md` look good?

- `LGTM`
- `Needs FR/NFR revisions`
- `Needs AC/traceability revisions`
- `Other: <custom feedback>`
