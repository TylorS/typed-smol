## Review Scope

- workflow_slug: 20260524-1027-cohesion-alignment-followup-review
- reviewed_surface: current `codex/typed-beta` cohesion across UI primitives, compiler/template runtime, Storybook/virtual modules, and DevTools packages.
- mode: review

## Findings

### P1 - RealWorld VMC/root build was broken by generated typed API client channel ergonomics

- what: `@typed/app` should propagate custom `HttpClient.With<E, R>` endpoint channels for callers that opt into custom clients, but those channels must not be forced into the default user-facing client shape. The break happened where custom-client E/R propagation met wrappers still anchored to the default `TypedRawClient` shape.
- why_it_matters: `typed-realworld` no longer typechecks, and root `pnpm build` fails after package builds complete.
- where: `packages/app/src/internal/emitHttpApiSource.ts:1186`, `packages/app/src/internal/emitHttpApiSource.ts:1214`, `packages/app/src/internal/emitHttpApiSource.ts:1232`, `examples/realworld/src/Api.ts:19`, `examples/realworld/src/.browser.dependencies.ts:13`.
- suggested_fix: preserve E/R on explicit `makeTypedClientWith`/custom-client paths, while keeping default `makeTypedClient` ergonomics free from custom-client channels. Add an integration typecheck that imports `makeTypedClientWith` with a non-never `HttpClient.With<E, R>` and also proves the default client surface stays simple.
- evidence:
  - `pnpm build` failed in `typed-realworld`.
  - `pnpm --filter typed-realworld exec vmc -p tsconfig.json` failed after rebuilding `@typed/app`; the latest failure points at `src/.browser.dependencies.ts` and `src/Api.ts`.
  - `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts` passed, so the package-local test suite does not catch this cross-package regression.

### P1 - Compiler output and compiler runtime disagree about Effect-valued template parts

- what: the runtime now rejects auto-detected `Effect` values when the value kind is `"unknown"`, but `transformTemplateModule` still emits `valueKind: "unknown"` for DOM and server template parts, including tests that compile `Effect.succeed("Ada")`.
- why_it_matters: this is a compiler/runtime contract split. Templates can transform cleanly and then fail at mount/render time unless the compiler either proves and emits `valueKind: "effect"` or rejects the expression with a diagnostic.
- where: `packages/template/src/compiler-runtime/renderable.ts:136`, `packages/template/src/compiler-runtime/renderable.ts:157`, `packages/compiler/src/template/transformTemplateModule.ts:589`, `packages/compiler/src/template/transformTemplateModule.test.ts:42`.
- suggested_fix: choose one boundary and enforce it end to end: either infer/provide concrete renderable kinds from compiler analysis, or reject Effect-valued unknown parts during transform. Add an executable transformed-template test, not only a source snapshot.
- evidence:
  - `runDomBinding("unknown", Effect.succeed("Ada"), ...)` and `runServerSlot("unknown", Effect.succeed("Ada"), {})` both failed.
  - The same values with `kind === "effect"` succeeded.
  - Focused template/compiler tests passed, so current tests do not exercise the transformed runtime path.

### Resolved by intent clarification - RealWorld Storybook HTTP-server mode is the intended later-stage fidelity layer

- what: `examples/realworld/.storybook/main.ts` changes server mode from `"runtime-harness"` to `"http-server"` with fixed host, port, and proxy path. The user clarified that the work has reached the previously deferred "later" stage.
- why_it_matters: this is no longer a cohesion defect. The remaining issue is documentation and acceptance coverage: the ADR/spec should record that RealWorld is now exercising the HTTP-server fidelity layer, and smoke coverage should prove startup, proxying, and teardown.
- where: `examples/realworld/.storybook/main.ts`, `examples/realworld/package.json`, `.docs/adrs/20260522-2058-storybook-runtime-harness-first.md`.
- suggested_fix: keep HTTP-server mode, update the Storybook ADR/spec with a second-stage decision, and add a smoke test that proves process startup, proxying, and teardown.

## Positive Cohesion Signals

- DevTools protocol/runtime/chrome tests passed together.
- UI package focused tests passed in the earlier committed review artifact and no current uncommitted UI source changes remain.
- The virtual-modules Vite null-byte guard is directionally aligned with the prior non-fatal Storybook warning, and its focused test passes.

## Verification

- `pnpm --filter @typed/template exec vitest run src/compiler-runtime/renderable.test.ts`: passed.
- `pnpm --filter @typed/virtual-modules-vite exec vitest run src/vitePlugin.test.ts`: passed.
- `pnpm --filter @typed/template test`: passed.
- `pnpm --filter @typed/compiler exec vitest run src/template/emitServerTemplate.test.ts src/template/emitDomTemplate.test.ts src/template/transformTemplateModule.test.ts src/template/templateVitePlugin.test.ts src/integration/uiTemplateHmrHarness.test.ts`: passed.
- `pnpm --filter @typed/devtools-protocol test && pnpm --filter @typed/devtools-runtime test && pnpm --filter @typed/devtools-chrome test`: passed.
- `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts`: passed.
- `pnpm build`: failed in `typed-realworld`.
- `pnpm --filter typed-realworld exec vmc -p tsconfig.json`: failed after rebuilding `@typed/app`.
- `pnpm exec oxlint` over the current modified files: passed.
- `git diff --check`: passed.

## Memory Impacts

- short_term: generated client constructor tests need a cross-package RealWorld or fixture typecheck for `makeTypedClientWith`, because package-local tests did not catch the channel regression.
- stale_risk: Storybook runtime-harness-first guidance is now stale for RealWorld; update ADR/spec to record the HTTP-server second stage.
- promotion: no long-term memory promotion from this review until the broken gates are fixed.

## Resolution Update

- Fixed the generated typed API client wrapper so `makeTypedClientFromRaw` is generic over the actual raw client endpoint parameter shape instead of forcing custom `HttpClient.With<E, R>` clients back into default client return channels.
- Added Storybook runtime exports for `makeTypedClient`/`makeTypedClientWith` and moved RealWorld stories to consume the generated Storybook runtime API client directly.
- Added Vite resolver coverage for null-byte internal ids and suppressed invalid null-byte diagnostics from Vite internal resolver paths.
- Re-verified root `pnpm build`, focused app and virtual-modules Vite tests, RealWorld Storybook build, formatting, linting, and `git diff --check`.

## User Clarification

- E/R propagation is intended and should remain supported for explicit custom-client paths.
- The design concern is not allowing E/R, but designing default user-facing APIs around those custom channels.
- RealWorld Storybook HTTP-server mode is intentionally the later-stage fidelity layer.
