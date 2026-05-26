# Requirements - DevTools RealWorld End-To-End Proof

Status: approved on 2026-05-26.

## Functional Requirements

- FR-1: RealWorld must provide an explicit devtools smoke mode that enables the generated browser runtime bridge without enabling devtools in the default app build.
- FR-2: The generated RealWorld browser runtime must create one enabled `DevtoolsRuntimeService` and share it across DOM registry, runtime bridge, and runtime event replay.
- FR-3: The RealWorld app bridge handshake must advertise only capabilities the inspected runtime can actually serve.
- FR-4: The Chrome panel must render live inspected RealWorld runtime data when connected and must render explicit unavailable or empty states when a capability is not wired.
- FR-5: Fixture-backed panel data must not count as proof for RealWorld Components, Fx, RefSubjects, HMR, Navigation, OTEL, DOM, or Sources functionality.
- FR-6: RealWorld component/template mount events must appear in the runtime event stream and populate the component tree.
- FR-7: DOM deep links must resolve from a mounted RealWorld DOM binding to its owning component/template when the DOM registry has a binding.
- FR-8: Source deep links must resolve through compiler/source facts when available, or show a precise source-analyzer unavailable state when that bridge is missing.
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

## Acceptance Criteria

- AC-1: A RealWorld devtools smoke mode can be invoked by a documented command or environment flag and generated browser source contains the devtools bridge only in that mode. Maps to FR-1, FR-2, NFR-1, NFR-2, NFR-8.
- AC-2: A runtime/bridge test proves one `DevtoolsRuntimeService` event bus is shared by DOM registry, bridge handshake, and event replay. Maps to FR-2, FR-3, NFR-3.
- AC-3: A panel or inspected-window smoke connects to RealWorld, reports `runtime connected`, and receives no fixture-only runtime rows. Maps to FR-4, FR-5, NFR-6, NFR-7.
- AC-4: RealWorld component/template mount data appears in the panel component tree after hydration. Maps to FR-6, NFR-8.
- AC-5: A mounted RealWorld DOM binding can be inspected or resolved to its component/template, or the test records the exact missing binding dependency. Maps to FR-7, FR-19.
- AC-6: Source action output either opens/resolves a RealWorld source target from compiler/source facts or shows the source-analyzer unavailable state with no fabricated browser-only analysis. Maps to FR-8, FR-19, NFR-4.
- AC-7: A RealWorld interaction emits at least one live Fx row or records the exact compiler/runtime instrumentation gap preventing Fx proof. Maps to FR-9, FR-10, FR-19, NFR-3.
- AC-8: A RealWorld interaction emits at least one RefSubject snapshot/update row or records the exact missing RefSubject owner/service instrumentation gap. Maps to FR-11, FR-12, FR-19.
- AC-9: RealWorld HMR proof shows template optimization separately from stateful-HMR status and rejection reasons. Maps to FR-13, FR-14.
- AC-10: RealWorld route transitions emit Navigation rows in the panel. Maps to FR-15, FR-16.
- AC-11: OTEL rows render span identity and Typed correlations from the selected first-pass trace source, or the requirements/spec explicitly mark OTEL as blocked by a named source decision. Maps to FR-17, FR-18, FR-19.
- AC-12: Local proof instructions list commands, ports, browser/extension setup, expected visible rows, and known environment blockers. Maps to FR-20, NFR-12, NFR-13.
- AC-13: Every Phase 4 task links back to one or more FR/NFR ids and updates workflow memory before commit. Maps to NFR-11, NFR-13.

## Prioritization

- must_have:
  - FR-1 through FR-8
  - FR-13 through FR-16
  - FR-19 through FR-20
  - NFR-1 through NFR-13
  - AC-1 through AC-6
  - AC-9 through AC-13
- should_have:
  - FR-9 through FR-12
  - FR-17 through FR-18
  - AC-7
  - AC-8
  - AC-11
- could_have:
  - richer Navigation transition details beyond type and destination
  - full Fx graph topology if runtime/compiler facts are ready
  - automated Chrome extension smoke if an inspected-window smoke proves the same live bridge first

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
