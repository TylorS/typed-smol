# Memories - Typed DevTools Chrome Extension

## Durable Notes

- Use one protocol-owned id surface in `@typed/devtools-protocol`; downstream packages must import these ids instead of redeclaring branded strings.

## Task Notes

### T1

- Protocol ids are centralized in `packages/devtools-protocol/src/Ids.ts` and remain plain strings at runtime.
- Keep downstream packages importing id constructors/types from `@typed/devtools-protocol`; do not redeclare brands locally.
- New publishable workspace packages need both `pnpm-lock.yaml` importer wiring and `scripts/publish-beta.sh` topo-order wiring in the same task that creates the package.

### T2

- Decode cross-boundary protocol payloads through `decodeDevtoolsPayload` or lane-specific helpers so Effect Schema uses `onExcessProperty: "error"`.
- Use `extension-panel` as the host-neutral DevTools peer name; keep Chrome API names inside the Chrome package.
- Keep public value payloads as `SerializedValue`; do not put raw `unknown` values on protocol events.
- Redaction happens during serialization before values cross runtime or Chrome bridges.
- Redaction must inspect property descriptors before reading values so sensitive accessors cannot execute.
- Protocol numeric fields should use finite-number codecs; do not accept `NaN` or infinities at decode boundaries.
- OTEL Typed correlation ids must use branded Typed id schemas, not raw strings.
- HMR protocol facts must keep `template.optimized` separate from `stateful` eligibility or rejection reasons.

### T3

- Direct `effect/unstable/rpc` usage belongs in `packages/devtools-protocol/src/Rpc.ts`; downstream packages should consume Typed protocol exports.
- Use `RpcTest.makeClient` with `TypedDevtoolsRpcGroup.toLayer(...)` for host-neutral in-process RPC verification.
- Protocol fixtures should use exported id constructors and `satisfies` against schema-derived types instead of duplicating message shapes.

### T4

- Compiler DevTools facts can carry rich compiler-only fields, but cross-boundary payloads must use the protocol-safe `ComponentSummary` shape.
- Use `TemplateModuleTemplate` evidence from `analyzeTemplateModule` when source spans or expression mapping are needed.
- Match `transformTemplateModule` for node-part effective runtime paths; template source ids should reflect the runtime anchor path, not only parser part paths.
- Fallback RefSubject ids must include component scope (`moduleId#exportName#localName`) to avoid local-name collisions.
- Sparse template part ids should include kind, optional name, path, and nested value indexes; static-only `templateHash#path#static` is not unique enough.

### T5

- HMR DevTools facts adapt `CompileCapabilitiesPlan` into protocol `HmrStatusFact`; do not create compiler-local HMR protocol shapes.
- Keep `template.optimized` independent from `stateful` eligibility so optimized HTML templates can still show rejected or unknown stateful-HMR status.
- Dependency and route HMR rejection reasons need protocol mapping at the compiler boundary, not inside Chrome/runtime consumers.
- Sort HMR service ids by module id and service id before emitting facts so repeated plans are deterministic across input ordering.
- A route component with no inferred stateful services and no explicit compiler rejection should emit `Unknown`, not `Rejected`.

### T6

- Source Analyzer planning should accept protocol `SourceAnalyzerRequest` and emit protocol `SourceAnalyzerResponse`; compiler-only artifact matching belongs around that protocol boundary.
- When no compiler artifact matches the DevTools resource/module/source-map alias, return `Unavailable` rather than running a browser-only approximation.
- Resource matching should compare resource URL, module id, and source-map/original-resource aliases after normalizing file URLs and path separators.
- Treat protocol Source Analyzer line/column positions as zero-based DevTools coordinates by default; one-based compiler/editor coordinates must opt in at the planner boundary.
- Source Analyzer definition locations should come from TypeScript declaration name spans, not first textual matches, so comments/imports/template references cannot steal the source location.

### T7

- The runtime package starts as an explicit Effect service/Layer boundary; the default Layer must be disabled and no-op.
- New publishable workspace packages need lockfile wiring and `scripts/publish-beta.sh` topo-order updates in the same task that introduces them.
- Runtime package code can depend on protocol ids/events, but direct `effect/unstable/rpc` remains isolated to the protocol package and later transport adapters.
- Disabled runtime services should use a no-op service path, and enabled runtime snapshots should clone protocol events on emit/read to prevent caller-owned object mutation.

### T8

- App config owns only opt-in resolution and explicit Layer construction; runtime capture remains in `@typed/devtools-runtime`.
- Object-form devtools config must require `enabled: true`; a `sessionId` alone does not enable instrumentation or allocate a runtime session id.
- Stage app config exports surgically when concurrent config work adds unrelated exports or options in the same files.

### T9

- Runtime event replay state should distinguish disabled, ready, partial retention-window replay, and session mismatch; Chrome/reconnect code should not infer those states from an empty event list.
- `DevtoolsRuntimeService.emit` and bridge subscriptions must share the same `RuntimeEventBus`; otherwise Fx and RefSubject instrumentation can emit successfully but remain invisible to DevTools clients.
- Runtime bridge code may call `TypedDevtoolsRpcGroup.of` from the protocol package, but direct `effect/unstable/rpc` imports stay out of runtime.
- Replay cursors should be sequence-based (`sinceSequence`, `oldestRetainedSequence`, `nextSequence`) rather than timestamp-based, because runtime event timestamps can repeat or arrive out of order.
- Runtime replay state belongs in `@typed/devtools-protocol` as a stream item so RPC clients can distinguish ready, partial, disabled, and session-mismatch states before consuming events.
- Custom EventBus injection must not create conflicting session authorities; runtime service, bridge, and bus sessions must agree when defined.

### T10

- DOM template DevTools binding notifications must be lazy inside the returned mount Effect; constructing an Effect must not fire observer callbacks.
- DevTools observer failures must not affect template rendering because instrumentation is diagnostic-only.
- Large-template table-driven DOM metadata must emit `event` without `valueKind` and `ref` with `valueIndex`, matching `DomTemplateBinding`.

### T11

- Runtime DOM registry lookups should store direct template ownership in a `WeakMap<Node, DomNodeRecord>` and resolve selected descendants by walking parent nodes to the nearest registered owner.
- Template observer binding ids are runtime strings; convert them to protocol `DomBindingId` values, but reconstruct `TemplatePartId` using the compiler fact identity shape `templateHash#runtimePath#valueIndex`.
- Same-template pending DOM bindings must be associated with the mounted root by node ancestry, not by template hash alone, so concurrent mounts cannot delete each other's active bindings.
- Unmounted roots can delete bridge-visible binding records while stale weak node entries remain harmless because node resolution must verify the binding id is still active.

### T12

- RefSubject DevTools event types should be discriminated unions so snapshot and update observers narrow without casts.
- Initial RefSubject DevTools notification can observe the `DeferredRef` wakeup before the public version increments; normalize the captured first event in the instrumentation layer rather than changing `DeferredRef`.
- Keep RefSubject observer failures diagnostic-only: swallow observer exceptions and leave `RefSubject` get/set/run semantics unchanged.

### T13

- Runtime RefSubject capture must serialize values before calling `DevtoolsRuntimeService.emit`; raw values should not reach the bridge bus.
- RefSubject capture should prefer service ids, then owner-qualified local ids, then explicit ids; missing identity should be skipped instead of mapped to a shared anonymous id.
- Bounded RefSubject capture history should reuse `RuntimeEventBus` retention instead of keeping a separate per-capture history store.

### T14

- Fx DevTools hooks should stay opt-in around a specific `Fx`; global constructor instrumentation waits for app/runtime config wiring.
- Fx lifecycle instrumentation must record only the first terminal event, so failed or interrupted streams do not also emit `Completed`.
- Keep Fx DevTools ids as host-neutral runtime strings inside `@typed/fx`; protocol id branding belongs in runtime capture.

### T15

- Runtime Fx capture should serialize emitted values and failure/interruption causes before calling `DevtoolsRuntimeService.emit`.
- Fx node ids should prefer owner-qualified ids, then RefSubject-qualified ids, then explicit unowned ids; missing identity should be skipped.
- Type helpers for protocol runtime events should narrow to the `FxNodeEvent` union member before reading phase/value fields.

### T16

- Runtime HMR capture should consume protocol `HmrStatusFact` values directly and avoid importing compiler packages.
- Runtime HMR capture should reuse `DevtoolsRuntimeService.emit` and EventBus retention instead of keeping a separate HMR history.

### Validation Repairs

- Runtime event tests should narrow `RuntimeEventEnvelope` to a concrete event variant before reading variant-specific fields like `version`, `phase`, or `value`.

### T17

- Runtime Navigation capture should consume `@typed/navigation` `NavigationEvent` values and expose a `NavigationHandler`-compatible hook for `Navigation.onNavigation`.
- Navigation runtime event ids can default to `<navigation type>:<destination id>`; custom correlation ids belong behind a `resolveId` option.
- Runtime Navigation capture failures from id resolution, time sources, or runtime emission must be swallowed because capture is diagnostic-only.

### T18

- Runtime OTEL correlation should preserve `traceId` and `spanId` verbatim and only attach Typed ids as additive metadata.
- Runtime OTEL correlation should emit protocol `OtelSpan` events through `DevtoolsRuntimeService.emit` so EventBus retention and bridge capability filtering stay shared.

### T19

- Source Analyzer should reuse compiler component identity derivation for exported component declarations and aliases instead of reimplementing component detection locally.
- Deduped Source Analyzer component facts may need alternate match spans so selection on template expressions still returns the declaration-owned fact.
- Runtime AnalyzeSource bridge support stays host-neutral: inject a compiler/dev-server handler into the bridge instead of importing compiler packages into `@typed/devtools-runtime`.
- The bridge should advertise `source-analyzer` by default only when an Analyzer handler is installed; otherwise the RPC path returns an explicit unavailable state.
