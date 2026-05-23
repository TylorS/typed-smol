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
