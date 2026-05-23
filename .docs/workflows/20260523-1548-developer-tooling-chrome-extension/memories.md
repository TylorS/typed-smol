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
