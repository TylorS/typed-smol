## Research Questions

- RQ-1: What current repo surfaces define the existing runtime, template, Fx, and virtual-module compiler boundaries?
- RQ-2: What does the current Vite HMR API allow for state preservation and invalidation?
- RQ-3: What TypeScript compiler API capabilities constrain a type-directed template compiler?
- RQ-4: How should `@typed/compiler` relate to `@typed/virtual-modules-compiler` without replacing `vmc`?
- RQ-5: What requirements follow from the human decisions around all-`html` optimization, service-backed `RefSubject` HMR, route components, dependency modules, and generated closure contexts?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| `packages/template/src/RenderTemplate.ts` | 2026 | repo code | high | Current `html` tag delegates to the `RenderTemplate` service and preserves renderable error/service types. |
| `packages/template/src/Render.ts` | 2026 | repo code | high | DOM rendering currently parses/caches templates, hydrates when possible, sets up dynamic parts/events, and manages scope cleanup. |
| `packages/template/src/Html.ts` | 2026 | repo code | high | Server/HTML rendering currently parses/caches templates and emits HTML render events/strings. |
| `packages/fx/src/Fx/constructors/fn.ts` | 2026 | repo code | high | `Fx.fn` already exists and wraps `Effect.fn` while unwrapping returned `Fx`. |
| `packages/fx/src/RefSubject/RefSubject.ts` | 2026 | repo code | high | `RefSubject` is observable mutable state and already has service-like/current-behavior patterns. |
| `packages/app/src/internal/emitBrowserSource.ts` | 2026 | repo code | high | Browser virtual-module runtime composes route matchers, browser router, DOM render template, and companion layers. |
| `packages/app/src/internal/emitServerSource.ts` | 2026 | repo code | high | Server virtual-module runtime composes API/route layers, HTML pages, config-derived build paths, and static assets. |
| `packages/virtual-modules-compiler/src/compile.ts` | 2026 | repo code | high | `vmc` is the TypeScript compiler-host adapter and uses virtual-module resolver plus artifact-store integration. |
| `packages/virtual-modules-vite/src/vitePlugin.ts` | 2026 | repo code | high | Vite virtual-module integration resolves/loads generated modules and can use the artifact store. |
| `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md` | 2026 | accepted ADR | high | Framework features must stay explicit virtual modules and avoid filesystem routing. |
| `.docs/adrs/20260515-2018-virtual-module-artifact-store.md` | 2026 | accepted ADR | high | Generated artifact correctness depends on source/config/plugin/compiler fingerprints. |
| `.docs/specs/virtual-modules/spec.md` | 2026 | durable spec | high | Defines virtual module plugin, TypeInfo API, compiler-host adapter, and language-service adapter behavior. |
| Vite HMR API docs: `https://vite.dev/guide/api-hmr` | 2026 | official docs | high | `import.meta.hot.data` persists per-module data; `accept`, `dispose`, `prune`, and `invalidate` define HMR lifecycle. |
| Vite plugin API docs: `https://vite.dev/guide/api-plugin` | 2026 | official docs | high | `handleHotUpdate` can filter modules, invalidate, trigger reloads, and send custom HMR events. |
| TypeScript Compiler API wiki: `https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API` | current | official vendor docs | high | `createProgram`, compiler hosts, emit, diagnostics, and type checker APIs support type-directed analysis/code generation. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `Vite HMR API import.meta.hot data dispose accept invalidate official docs` | Verify current HMR lifecycle and state persistence substrate. | `https://vite.dev/guide/api-hmr` |
| `TypeScript Compiler API using the compiler API official wiki createProgram typeChecker emit` | Verify official TypeScript compiler/type checker APIs. | `https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API` |

## Key Findings

- `@typed/template` already has a clean environment split through `RenderTemplate`: DOM and HTML renderers are services, while `html` preserves types through `Renderable.Error` and `Renderable.Services`.
- Current DOM rendering does runtime parsing, fragment construction, dynamic-part setup, hydration lookup, event setup, and scope cleanup. This creates obvious compiler targets: precomputed template IR, prebuilt static structure, and target-specific dynamic part instructions.
- Current HTML rendering already converts parsed templates into chunks; server optimization can target chunk generation and dynamic render plans.
- `Fx.fn` exists. The HMR design can refer to both `Fx.gen` and `Fx.fn` without first inventing `Fx.fn`.
- `RefSubject` is already the right state substrate, but anonymous inline `RefSubject.make(...)` calls are not identity-stable across HMR. The human-selected direction is to replace eligible inline refs with `RefSubject.Service`-backed identities and reuse them from a dev registry.
- Vite HMR supports per-module persistent `hot.data`, disposal, pruning, invalidation, and custom update handling. It does not by itself prove state compatibility, so Typed must add its own version/fingerprint/shape checks.
- `vmc` already owns compiler-host integration. `@typed/compiler` should be a focused template/app compiler package that integrates with existing virtual-module and artifact-store surfaces, not a `vmc` replacement.
- All `html` templates are compiler optimization targets. Stateful HMR is narrower: route components and participating dependency modules with compiler-visible state boundaries.
- Component-local closures can be staged toward HMR by rewriting eligible captures/arguments into generated typed context objects; arbitrary closure serialization remains forbidden.

## Open Risks and Unknowns

- Exact public shape of `RefSubject.Service` still needs specification against the existing `Fx.Service` and `Context.Service` patterns.
- Exact compiler IR shape is undecided.
- Full coverage for all `html` template forms is a large implementation effort and must be broken into staged tasks.
- Dependency participation inference may over-preserve state unless opt-out controls and diagnostics are good.
- Closure-to-context rewriting can become a TypeScript transform project of its own; it should follow service-backed HMR in execution order.

## Implications for Requirements and Specification

- Requirements must distinguish general template optimization from stateful HMR.
- Requirements must make all `html` template optimization must-have, not a representative proof only.
- Requirements must make route components and participating dependencies the HMR state boundary.
- Requirements must preserve `vmc` as the compiler-host adapter and make `@typed/compiler` a new focused template/app compiler package.
- Specification must define compiler IR, target emitters, app runtime APIs, HMR registry semantics, service-backed `RefSubject` identity, dependency participation controls, and closure-context rewriting eligibility.

## Alignment Notes

- specs_alignment:
  - Aligns with `.docs/specs/virtual-modules/spec.md` by keeping virtual-module resolution and TypeInfo/compiler-host behavior in the existing substrate.
  - Aligns with `.docs/specs/virtual-module-artifact-store/spec.md` by requiring fingerprinted generated artifacts where materialized.
  - Aligns with `.docs/specs/typed-framework-starter/spec.md` by treating `@typed/app` as app runtime and framework virtual-module integration.
- adrs_alignment:
  - Aligns with `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`; no filesystem routing is introduced.
  - Aligns with `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`; cache reuse must be fingerprint-driven.
- workflows_alignment:
  - Builds on `.docs/workflows/20260521-2320-runtime-template-compiler/intent.md` and `scope.md`.
  - Existing workflow folders remain reference-only.

## Memory Promotion Candidates

- procedural: For future Typed compiler work, treat `@typed/compiler` as a focused template/app compiler package and keep `@typed/virtual-modules-compiler` as the `vmc` host adapter unless explicitly changed. Confidence: high after human approval.
- heuristic: Do not conflate all-template optimization with stateful HMR; all `html` templates can be optimized, but HMR state is limited to route components and participating dependencies with stable service/context identity. Confidence: high after human approval.
- heuristic: Prefer `RefSubject.Service` identity over lexical keys for HMR state preservation; keys are fallback metadata and diagnostics. Confidence: high after human approval.
