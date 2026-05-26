# Requirements

## Functional Requirements

- FR-1: `MountOptions` must accept an optional compiled DOM runtime object and pass it to `CompiledDomTemplate.renderInto`.
- FR-2: The app browser runtime must build one `DomTemplateRuntime` from default route/action resume registries and optional devtools config.
- FR-3: Compiled templates with event action descriptors must attach action resume listeners during browser hydration.
- FR-4: Browser virtual modules must hydrate with the app-owned DOM runtime helper.
- FR-5: Devtools-enabled browser runtime must install `globalThis.__TYPED_DEVTOOLS__.resolveSelectedElement`.
- FR-6: Devtools-disabled browser runtime must leave the global bridge absent or explicitly unbound.
- FR-7: Storybook RealWorld builds must keep consuming `typed:storybook/runtime?path=/` and runtime defaults.
- FR-8: `packages/ui/AGENTS.md` must describe the headless component-library surface currently documented in the README.
- FR-9: Developer-tooling-owned changes must wait for handoff from the active developer-tooling agent.
- FR-10: RealWorld must pass the full local functional/compliance gate: `check`, `build`, `test`, `test:acceptance:local`, `test:hmr:local`, and `storybook:build`.
- FR-11: RealWorld must prove route resumability and action resumability through the real generated browser runtime, not through isolated unit tests alone.
- FR-12: RealWorld routes and UI action handlers must fail closed when something is not resumable; final verification must have no known non-resumable app path.
- FR-13: Any browser externalization or virtual-id warning that affects RealWorld runtime correctness is a blocker, even if it belongs to the developer-tooling workflow.
- FR-14: Remediation work must conform to `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`.
- FR-15: Any proposed change that introduces a second owner for browser runtime handoff, route/action resume runtime, DevTools bridge installation, Storybook app runtime behavior, or virtual-module host integration must be rejected or moved behind a new approved ADR.

## Non-Functional Requirements

- NFR-1: Keep virtual-modules-only architecture; do not add filesystem routing or local typed-module shims.
- NFR-2: Keep Storybook as a consumer of app/runtime virtual modules.
- NFR-3: Keep broad public `unknown` channels out of Storybook and app public helpers unless the runtime boundary truly requires them.
- NFR-4: Prefer focused tests that fail before implementation.
- NFR-5: Keep changes narrow and commit per coherent subgoal during execution.
- NFR-6: Do not revert or absorb another agent's work.
- NFR-7: Document developer-tooling handoff status before touching tooling-owned files.
- NFR-8: Do not claim RealWorld is compliant unless the upstream local acceptance runner passes.
- NFR-9: Do not claim 100% resumability unless the generated app path and RealWorld fixture prove it with executable tests.
- NFR-10: Preserve DRY, SOLID, and YAGNI as testable architecture constraints: one owner per responsibility, no duplicate runtime paths, and no abstraction without a failing gate that requires it.

## Open Coordination Point

The null-byte virtual id warning and browser externalization warnings may overlap with the active developer-tooling workflow. They are handoff-gated for ownership, but they are not optional for release readiness if they affect RealWorld compliance or resumability.

## Scope Expansion: Tooling, DevTools, Compiler Runtime, And Type Safety

The human explicitly expanded this workflow after the initial cohesion remediation pass because several shipped surfaces are still misleading or broken:

- VS Code virtual modules tree does not populate.
- `@typed/virtual-modules-ts-plugin` can make tsserver stop responding to basic hover and type-checking.
- Generated `TypedClientInput` erases endpoint return types to `unknown`.
- `TypedClient` adds little value over Effect `HttpApiClient` unless it preserves endpoint request/return/channel types.
- Compiled server templates do not prove they provide `RefSubject.CurrentComputedBehavior = "one"`.
- Chrome DevTools panel currently renders fixture-backed data and must not present fake capability as live functionality.
- DevTools instrumentation must cover real Fx, RefSubject, component/template/runtime events before the panel claims support.
- Type casts must be audited and reduced, especially in generated clients, compiler/template runtime, virtual-module host adapters, and Fx/RefSubject internals.

### Added Functional Requirements

- FR-16: VS Code virtual modules tree discovery must resolve virtual imports against each importer file's nearest project root, not only the workspace folder root.
- FR-17: VS Code virtual modules tree must have a regression test that fails when a monorepo workspace contains a nested app with its own `vmc.config.ts`.
- FR-18: TS plugin heavy operations must be measured before optimization: fallback program creation, type-target bootstrap program creation, TypeInfo session creation, artifact fingerprinting, dependency hashing, stale-record rebuild, and diagnostics refresh.
- FR-19: TS plugin responsiveness remediation must preserve basic hover/type-checking responsiveness by avoiding full-program or full-fingerprint work on hot language-service request paths unless bounded by a measured cache.
- FR-20: Generated HttpApi client helpers must not erase endpoint request, success, error, or service types to `unknown` or `any`.
- FR-21: Generated client tests must prove custom `HttpClient.With<E, R>` channels survive through `makeClientWith` and any typed helper.
- FR-22: If a generated `TypedClient` wrapper remains, it must be a thin typed projection over `HttpApiClient.ForApi`; otherwise public docs/examples should use `HttpApiClient.ForApi` directly.
- FR-23: Compiled server template execution must provide the same `RefSubject.CurrentComputedBehavior = "one"` semantics that interpreted `HtmlRenderTemplate` provides for SSR.
- FR-24: DevTools panel must render live runtime event data from the inspected app when connected and must show explicit unavailable/empty states when a capability is not wired.
- FR-25: DevTools panel tests must stop treating fixture data as proof of live Components/Fx/RefSubject/HMR/Navigation/OTEL functionality.
- FR-26: Runtime instrumentation must provide a truthful path from Fx, RefSubject, component/template mount/unmount, DOM bindings, HMR, navigation, and OTEL events into the runtime event bus.
- FR-27: DevTools bridge handshake must advertise only capabilities that the inspected runtime can actually serve.
- FR-28: Type-cast remediation must classify casts as validated boundary casts, TypeScript limitation casts, test-only casts, or removable unsafe casts.
- FR-29: New or retained production casts in touched surfaces must have either a local runtime/type guard or a short justification at the boundary.

### Added Non-Functional Requirements

- NFR-11: Do not improve DevTools visual polish before the data model is truthful; a polished fake panel is worse than an explicit unavailable state.
- NFR-12: Prefer instrumentation through existing public Fx/RefSubject/component/template hooks before adding broad magic global patching.
- NFR-13: TS plugin fixes must be based on measured latency counters or logs, not speculative caching.
- NFR-14: Developer-tooling handoff is now granted by the human for VS Code tree, TS plugin responsiveness, and cast/type-safety work in this workflow.
- NFR-15: Cast cleanup must avoid broad churn; start with casts that directly erase user-facing type safety or mask runtime host/protocol boundaries.
