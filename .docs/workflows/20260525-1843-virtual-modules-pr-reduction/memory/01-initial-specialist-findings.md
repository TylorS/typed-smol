# Initial Specialist Findings

## Generated HttpApi Client

- Current generator no longer emits `TypedClientInput`, but still emits `makeTypedClient`, `makeTypedClientWith`, `TypedRawClient`, `OptionalEndpoint`, and `makeTypedClientFromRaw`.
- Raw `HttpApiClient.makeWith(Api, { httpClient })` already preserves `HttpClient.With<E, R>` channels through `HttpApiClient.ForApi<typeof Api, E, R>`.
- RealWorld `src/Api.ts` is mostly aligned with the raw surface already.
- Storybook runtime generation and at least one RealWorld story still consume or re-export `makeTypedClient`.
- Stale `.typed` generated artifacts can retain `TypedClientInput` and `(...args) => unknown` after source changes.

Candidate requirement: generated client output must remove all `TypedClient` wrapper exports and tests must scan both generated source and regenerated artifacts for stale erasure.

## DevTools Inspectability

- Protocol schemas, runtime event bus, replay, and bridge primitives exist.
- App runtime `__TYPED_DEVTOOLS__` bridge is currently too narrow: DOM/component resolution and unavailable source analysis, but no runtime event subscription through the shared `DevtoolsRuntime`.
- Chrome panel still relies heavily on fixture-backed data and does not prove live Fx, RefSubject, HMR, Navigation, or OTEL streams from an inspected app.
- `typed.config.devtools` exists, but Vite currently appears to enable browser devtools through smoke-mode environment plumbing rather than a normal dev/build/preview config path.

Candidate requirement: DevTools readiness must be a live vertical slice from generated app runtime to Chrome panel subscription, with explicit unavailable states for unwired capabilities.

## Failed Read-Only Lanes

- Virtual-module host surface exploration failed during remote compaction before returning a handoff.
- Compiler/template/HMR coverage exploration failed during remote compaction before returning a handoff.

Research-stage follow-up: redo both lanes directly or with fresh bounded agents before finalizing requirements.
