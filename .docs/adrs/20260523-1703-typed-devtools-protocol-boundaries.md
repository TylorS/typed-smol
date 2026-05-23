# ADR: Typed DevTools Protocol Boundaries

## Status

accepted

## Context

Typed DevTools needs to serve multiple hosts:

- compiler and `vmc` surfaces;
- runtime instrumentation Layers;
- Vite/dev-server Analyzer bridge;
- Chrome DevTools panel, Elements sidebar, and Sources sidebar;
- Storybook and test fixtures;
- future editor or CLI clients.

If each host defines its own event shapes, ids, redaction behavior, or trace correlation model, the tooling will drift quickly and become hard to test. The extension must also avoid pulling Chrome-specific concepts into compiler/runtime packages.

## Decision

Create `@typed/devtools-protocol` as the host-neutral source of truth for DevTools contracts.

- Protocol owns schemas/codecs, ids, event lanes, capability negotiation, redaction/serialization helpers, and fixtures.
- Protocol defines communication through `effect/unstable/rpc` `Rpc` and `RpcGroup` definitions instead of ad-hoc message unions.
- Runtime instrumentation is staged behind `@typed/devtools-runtime` or an equivalent runtime boundary that owns Layers, bridge registration, Fx capture, RefSubject capture, and DOM registry wiring.
- Chrome implementation is staged behind `@typed/devtools-chrome` or an equivalent Chrome-specific boundary that owns MV3 manifest, DevTools panel UI, Elements/Sources integration, and Chrome messaging.
- Compiler/runtime packages emit or consume protocol facts but do not depend on Chrome APIs.
- Chrome messaging, `window.postMessage`, HTTP, WebSocket, and in-process fixture transports are adapters around the shared RPC groups.
- Instrumentation is disabled by default, primarily enabled through `typed.config.ts`, and available as an explicit runtime `Layer` for direct app composition.

## Consequences

Positive:

- Compiler, runtime, Chrome extension, Storybook, and tests share one typed contract.
- Chrome remains a protocol client rather than the semantic owner.
- Type tests can guard inference and invalid payload rejection in one place.
- Storybook and fixtures can validate UI/protocol behavior before the full extension is ready.
- Future VS Code or CLI clients can reuse the same protocol.

Trade-offs:

- The first implementation must create a small package before Chrome UI work can move quickly.
- Runtime and Chrome work require explicit adapters around the protocol rather than direct ad-hoc messages.
- Versioning and capability negotiation become first-class concerns early.
- `effect/unstable/rpc` is unstable, so direct usage must remain isolated behind Typed protocol exports and thin transport adapters.

## Alternatives considered

1. Keep protocol types inside the Chrome extension:
   - Rejected because Storybook, compiler, runtime, and future editor clients would duplicate message shapes or depend on Chrome packages.
2. Put all DevTools contracts in `@typed/compiler`:
   - Rejected because runtime, Chrome, Storybook, and OTEL correlation are not compiler-only concerns.
3. Put all DevTools contracts in `@typed/app`:
   - Rejected because the protocol must serve compiler and non-app fixture clients too.
4. Delay package creation until after a prototype:
   - Rejected because the first vertical slice already spans compiler, runtime, Chrome, Storybook, and tests.
5. Define communication with plain discriminated unions:
   - Rejected because the user explicitly wants `effect/unstable/rpc`, and RPC groups give a stronger type-safe protocol boundary.

## References

- `.docs/specs/typed-devtools/spec.md`
- `.docs/specs/typed-devtools/testing-strategy.md`
- `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/requirements.md`
- `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/02-research.md`
- `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`
- `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md`
- `.cursor/skills/effect-module-unstable-rpc/SKILL.md`
- `.cursor/skills/effect-facet-unstable-rpc-rpc/references/api-reference.md`
- `.cursor/skills/effect-facet-unstable-rpc-rpcgroup/references/api-reference.md`
- `.cursor/skills/effect-facet-unstable-rpc-rpcclient/references/api-reference.md`
- `.cursor/skills/effect-facet-unstable-rpc-rpcserver/references/api-reference.md`
- `.cursor/skills/effect-facet-unstable-rpc-rpcserialization/references/api-reference.md`
