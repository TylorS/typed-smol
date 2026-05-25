# Requirements

## Functional Requirements

- FR-1: Virtual modules must resolve and execute consistently across Vite dev, Vite build, Vite preview, `vmc`, TypeScript language service, VS Code, Storybook, and `examples/realworld`.
- FR-2: Production virtual-module output must be shaped by user-consumed imports plus the transitive dependency closure required by those imports.
- FR-3: Every first-party virtual-module plugin must consume one shared requested-export/dependency-closure contract rather than inventing plugin-local production pruning behavior.
- FR-4: HttpApi virtual modules must expose the raw Effect `HttpApiClient`-derived surface: `Api`, `Client`, `makeClient`, `makeClientWith`, and direct raw helper types where needed.
- FR-5: Generated HttpApi output must not expose `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, or mapped endpoint wrappers.
- FR-6: Generated HttpApi public types must preserve endpoint request parameters, success types, error types, service channels, and `HttpClient.With<E, R>` requirements through `HttpApiClient.ForApi<typeof Api, E, R>`.
- FR-7: VS Code and the TypeScript plugin must share the virtual-module resolver/artifact/cache substrate wherever they need generated module content, dependency fingerprints, or preview/type information.
- FR-8: VS Code-only caches may exist only as presentation caches above the shared substrate and must not own independent compiler/config/program truth.
- FR-9: The TypeScript plugin must preserve ordinary TypeScript language-service behavior while adding virtual-module resolution, hover, diagnostics, and definition support.
- FR-10: `typed.config.ts` must be the canonical product-level configuration source for framework behavior; Vite, Storybook, `vmc`, TypeScript plugin, and VS Code must adapt it instead of duplicating equivalent options.
- FR-11: Storybook must consume the same generated app/runtime/client/virtual-module contracts as application dev/build/preview surfaces.
- FR-12: Storybook DevTools proof must use live inspected runtime facts or explicit unavailable states, not static fixture-only data.
- FR-13: The compiler must discover module facts needed for virtual-module generation, route participation, template compilation, DevTools correlation, and HMR eligibility.
- FR-14: Stateful HMR must preserve `RefSubject` or equivalent runtime state only when compiler facts prove stable identity and compatible boundaries; otherwise HMR must fail closed.
- FR-15: Template compilation must produce optimized server HTML output and optimized DOM runtime output through the shared compiler path.
- FR-16: DevTools panels must be inspectable end to end from generated/compiler/runtime facts and must accurately report unavailable capabilities.
- FR-17: `examples/realworld` must remain the flagship integration surface for generated runtime, raw HttpApi client, Vite dev/build/preview, HMR, DevTools, Storybook, and typecheck behavior.
- FR-18: Stale generated artifacts must not mask or preserve removed public surfaces such as `TypedClient` after source regeneration.

## Non-Functional Requirements

- NFR-1: Type safety is release-blocking: generated public surfaces must not use `any`, `unknown`, or casts to hide broken inference in accepted APIs.
- NFR-2: Import precision is a correctness requirement, not only a bundle-size optimization; unused generated code must not enter the program graph when it can be excluded by requested-export/dependency analysis.
- NFR-3: Cache invalidation must be dependency-complete across source files, plugin modules, typed config, VMC config, tsconfig, compiler version, and generated-artifact manifest state.
- NFR-4: TS plugin and VS Code hot paths must be bounded and instrumentable for fallback program creation, TypeInfo session creation, dependency hashing, diagnostics refresh, hover, go-to-definition, tree refresh, and preview open.
- NFR-5: Shared host/cache/compiler abstractions must reduce duplication and clarify ownership without adding broad new public APIs that are not needed for this release slice.
- NFR-6: Storybook reliability must be measured through dev/build/typecheck/runtime checks, not only by package-local unit tests.
- NFR-7: Compiler optimization claims must be backed by executable output assertions, operation/shape checks, or benchmarks with documented thresholds.
- NFR-8: DevTools must not overclaim capability: unwired panels or streams must render explicit unavailable states.
- NFR-9: The PR must remain reviewable by sequencing implementation into small tasks with one or more acceptance criteria each.
- NFR-10: Workflow-local memory must capture reusable findings, but durable memory promotion waits for implementation evidence.

## Acceptance Criteria

- AC-1: A cross-surface virtual-module test matrix documents and runs the minimum gates for Vite dev, Vite build, Vite preview, `vmc`, TypeScript plugin, VS Code, Storybook, and RealWorld. Maps to FR-1, FR-17, NFR-6, NFR-9.
- AC-2: Production build tests for each first-party virtual-module plugin assert that unrequested exports, handlers, helper code, and imports are absent unless included by explicit dependency closure. Maps to FR-2, FR-3, NFR-2.
- AC-3: Conservative fallback cases for side-effect imports, default imports, `export *`, computed namespace access, and escaped namespace access remain covered by tests. Maps to FR-2, FR-3, NFR-2.
- AC-4: Generated HttpApi source and regenerated artifacts contain no `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, `OptionalEndpoint`, or wrapper endpoint mappings. Maps to FR-4, FR-5, FR-18, NFR-1.
- AC-5: Type-level tests prove the generated raw client preserves endpoint generics, request parameters, success types, error types, and `HttpClient.With<E, R>` channels. Maps to FR-4, FR-6, NFR-1.
- AC-6: RealWorld and Storybook imports are updated to use the raw client surface and fail if stale generated artifacts reintroduce wrapper names. Maps to FR-4, FR-5, FR-11, FR-17, FR-18.
- AC-7: VS Code and TS plugin tests verify they resolve the same virtual ids and generated content through a shared artifact/cache path. Maps to FR-7, FR-8, NFR-3, NFR-5.
- AC-8: TS plugin stability tests or instrumentation assert bounded fallback-program and TypeInfo-session creation across repeated hover, diagnostics, and definition requests. Maps to FR-9, NFR-3, NFR-4.
- AC-9: VS Code tree and preview tests assert refresh/invalidation uses shared fingerprints and presentation-only caches. Maps to FR-7, FR-8, NFR-3, NFR-4.
- AC-10: Config convergence tests prove equivalent app/server/build/preview/storybook options can be derived from `typed.config.ts` for Vite, Storybook, `vmc`, TypeScript plugin, and VS Code without duplicated option plumbing. Maps to FR-10, NFR-5.
- AC-11: Storybook build, story typecheck, and dev smoke checks use the same generated app/runtime/client contracts as application surfaces. Maps to FR-11, FR-17, NFR-6.
- AC-12: DevTools tests prove at least one live vertical slice from generated/compiler/runtime facts to a panel, and unavailable features render explicit unavailable states. Maps to FR-12, FR-16, NFR-8.
- AC-13: Compiler fact tests cover module discovery, route participation, template dependencies, DevTools correlation, and HMR eligibility/rejection. Maps to FR-13, FR-14, FR-16, NFR-7.
- AC-14: Stateful HMR tests prove state is preserved only across stable compiler-proven boundaries and reset/reload behavior occurs for rejected boundaries. Maps to FR-14, NFR-7.
- AC-15: Template compiler tests compare server HTML and DOM runtime output against hand-written baselines and document the chosen "better-than-hand-optimized" threshold. Maps to FR-15, NFR-7.
- AC-16: Final release gates include `pnpm build` plus targeted package, RealWorld, Storybook, TS plugin, VS Code, HMR, preview, DevTools, and production-pruning checks listed in the plan. Maps to FR-1, FR-17, NFR-6, NFR-9.

## Prioritization

- must_have:
  - FR-1 through FR-11
  - FR-17 through FR-18
  - NFR-1 through NFR-6
  - AC-1 through AC-11
  - AC-16
- should_have:
  - FR-12 through FR-16
  - NFR-7 through NFR-10
  - AC-12 through AC-15
- could_have:
  - Broader DevTools panel polish after live capability proof.
  - TypeScript 7 or `tsgo` experimentation after current TypeScript API integration is stable.

## Approval Gate

Status: approved by human.

Approved production dependency closure model: combined requested exports, plugin-declared internal dependencies, and TypeInfo/route/app graph reachability.
