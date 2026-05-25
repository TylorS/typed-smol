## Research Questions

1. How do the current virtual-module host surfaces differ across Vite, `vmc`, TS plugin, VS Code, Storybook, and app builds?
2. Which cache/artifact mechanisms already exist, and where are they duplicated or incomplete?
3. How should config flow across `typed.config.ts`, Vite, `vmc`, TypeScript plugin, VS Code, and Storybook without per-surface drift?
4. What does production import precision require beyond bundler tree-shaking?
5. Where does the current branch still violate type-safety requirements, especially generated HttpApi clients?
6. What external toolchain constraints should shape requirements for TS plugin stability, Vite production builds, Storybook reliability, and incremental correctness?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| `.docs/specs/virtual-modules/spec.md` | 2026 | local durable spec | high | Defines TypeInfoApi, virtual identity, host adapter responsibilities, and dependency tracking. |
| `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md` | 2026 | local ADR | high | Defines package ownership and RealWorld as compliance fixture. |
| `packages/virtual-modules/src/importUsageAnalyzer.ts` | 2026 | local code | high | Existing named-import analysis supports production import precision but only at the importer/source-text level. |
| `packages/virtual-modules-vite/src/vitePlugin.ts` | 2026 | local code | high | Vite build passes `requestedExports`; dev falls back to all exports. |
| `packages/app/src/HttpApiVirtualModulePlugin.ts` | 2026 | local code | high | Only HttpApi currently uses requested exports to choose client/full mode; still includes `makeTypedClient*` in client-safe exports. |
| `packages/virtual-modules-ts-plugin/src/plugin.ts` | 2026 | local code | high | TS plugin has artifact-store fingerprints and dependency-scoped source fingerprints, but also creates fallback programs and reloads config fingerprints. |
| `packages/virtual-modules-vscode/src/resolver.ts` | 2026 | local code | high | VS Code uses a separate resolver/program cache and direct `vmc.config.ts` loading rather than shared host/cache substrate. |
| `examples/realworld/typed.config.ts`, `vite.config.ts`, `.storybook/main.ts` | 2026 | local config | high | RealWorld duplicates server/build/preview/storybook settings across Typed, Vite, and Storybook configs. |
| [TypeScript LS plugin wiki](https://github.com/microsoft/typescript/wiki/Writing-a-Language-Service-Plugin) | current | official docs | high | LS plugins are configured through `compilerOptions.plugins` and decorate the language service. |
| [TypeScript compiler API wiki](https://github.com/microsoft/typescript/wiki/Using-the-Compiler-API) | current | official docs | high | Language service hosts expose script snapshots/versions for incremental updates. |
| [Vite plugin API docs](https://github.com/vitejs/vite/blob/main/docs/guide/api-plugin.md) | current | official docs | high | `configResolved` distinguishes `serve` and `build`; virtual modules use `resolveId`/`load` and internal IDs. |
| [Storybook Vite builder docs](https://github.com/storybookjs/storybook/blob/next/code/builders/builder-vite/README.md) | current | official docs | high | Storybook Vite customizes Vite through typed `main.ts` and `viteFinal`. |
| [Rollup configuration docs](https://rollupjs.org/configuration-options/#treeshake-modulesideeffects) | current | official docs | high | Tree-shaking can remove unused exports/modules but side-effect assumptions are semantics-sensitive. |
| [TypeScript 7.0 Beta announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/) | 2026 | official blog | medium | Confirms TS7 native performance direction but no stable programmatic API until later; requirements should not depend on TS7 APIs yet. |
| [Riker: Always-Correct and Fast Incremental Builds](https://www.usenix.org/conference/atc22/presentation/curtsinger) | 2022 | peer-reviewed paper | medium | Reinforces complete dependency modeling for correct incremental rebuilds. |
| [Build Systems à la Carte](https://simon.peytonjones.org/build-systems-a-la-carte/) | 2018 | peer-reviewed paper | medium | Useful vocabulary for separating build tasks, dependencies, scheduling, and rebuilding semantics. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `Build systems a la carte paper Mokhov Mitchell Peyton Jones 2018 PDF` | Find a primary build-system model for DRY/incremental design. | Build Systems à la Carte |
| `Riker always-correct and fast incremental builds paper USENIX ATC 2022` | Find evidence for dependency-complete incremental artifacts. | Riker USENIX paper |
| `Vite Rollup tree shaking moduleSideEffects documentation official` | Check production tree-shaking semantics and limits. | Rollup configuration docs |
| `TypeScript 7 Go native port official blog performance 2026 TypeScript 7` | Check 2026 TypeScript performance/tooling direction. | TypeScript 7.0 Beta announcement |

## Key Findings

### 1. Import-precise production output has a local starting point, but not a shared plugin contract.

`@typed/virtual-modules` already exposes `analyzeRequestedExports`, which detects named imports, type-only imports, named re-exports, static namespace property reads, namespace destructuring, and conservative all-export fallbacks for side-effect imports, default imports, export star, computed namespace access, or escaped namespace usage.

`@typed/virtual-modules-vite` passes `requestedExports` only during `build`; dev mode deliberately uses `{ kind: "all", reason: "dev mode" }`. This is directionally right: dev favors fidelity and debuggability, production favors precision.

The problem is that first-party plugins do not all consume this context. The strongest example is `HttpApiVirtualModulePlugin`: it chooses `client` output when build context requests only client-safe exports, but `CLIENT_SAFE_EXPORTS` still includes `makeTypedClient` and `makeTypedClientWith`, which conflicts with the approved scope. Composable route/service/header/middleware plugins appear to emit complete directory modules without a shared import-closure contract.

Implication: production precision needs a common `requestedExports + dependencyClosure` policy in `@typed/virtual-modules`, then each plugin must prove it emits only the requested export surface and the internal imports needed to satisfy that surface.

### 2. Bundler tree-shaking is not enough.

Rollup can remove unused exports/modules, but options such as `treeshake.moduleSideEffects` change semantic assumptions about side effects. Depending on a downstream bundler to erase unused generated code still allows stale type errors, server-only imports, or unsafe wrapper types to enter the program graph before bundling.

Implication: Typed plugins must generate import-precise modules before Rollup/Vite tree-shaking. Bundler tree-shaking is a final optimization layer, not the source of truth for correctness or type-safety.

### 3. Cache/artifact sharing exists, but VS Code and TS plugin still own parallel paths.

`@typed/virtual-modules` has a virtual artifact store, dependency descriptors, manifest validation, materialization, and adapter reuse tests. `vmc`, Vite, and TS plugin all create artifact stores with fingerprints. The TS plugin also tracks dependency snapshot tokens to avoid reusing stale records after watched dependency changes.

VS Code currently uses its own `programCache` keyed by project root, direct `vmc.config.ts` resolver loading, direct TypeInfo sessions, a tree-provider cache, and separate in-memory preview content. This is useful but not yet the same artifact-store contract used by Vite/`vmc`/TS plugin.

Implication: make VS Code a consumer of the shared artifact/cache substrate where possible. If VS Code keeps an in-memory presentation cache, it should sit above the shared resolver/artifact layer, not duplicate program/config/cache ownership.

### 4. TS plugin stability requires hot-path budgets and measured invalidation.

The TS plugin already tries to cache fallback programs and pre-create a TypeInfoApi session. It also fingerprints typed config, VMC config, plugin modules, parsed tsconfig, and dependency-scoped source inputs. However, the implementation still has repeated config/fingerprint work and fallback-program behavior that must be measured before changing.

TypeScript official docs show LS plugins are decorators over the existing language service. That supports a requirement that the plugin must preserve ordinary hover/type-checking behavior and avoid heavy recomputation on hot LS calls.

Implication: requirements should include measured counters/timing around fallback program creation, TypeInfo session creation, artifact fingerprinting, dependency hashing, stale-record rebuild, diagnostics refresh, hover, and semantic diagnostics.

### 5. Config is already centralizing in `typed.config.ts`, but real projects still duplicate host config.

`TypedConfig` covers entry, router, api, templates, html, browser, storybook, openapi, tsconfig, server, build, preview, test, lint, format, analyze, devtools, compression, and warning behavior. `@typed/vite-plugin` can auto-load typed config and derive Vite options.

But RealWorld duplicates build/server/preview in `typed.config.ts` and `vite.config.ts`, and Storybook separately passes `typedVite` plus server routes/api/proxy in `.storybook/main.ts`.

Implication: requirements should define a canonical config flow: `typed.config.ts` is the product-level source, hosts adapt it. Vite/Storybook/TS plugin/VS Code/`vmc` should not need to redefine equivalent values unless overriding host-specific behavior.

### 6. Storybook must be a production-like framework surface.

Storybook has package scripts for build, dev smoke, portable tests, story typecheck, and story tests. Storybook Vite official docs use `main.ts` plus `viteFinal` as the host seam. Local Storybook config currently carries separate `typedVite` and server options, while DevTools fixture research showed Storybook DevTools data is static fixture-backed.

Implication: Storybook acceptance must include typechecking/building stories through the same generated app/runtime/client contracts and must not rely on stale fixture-only DevTools proof.

### 7. TypeScript 7 matters strategically, but not as an execution dependency yet.

The 2026 TypeScript 7 beta announcement reports native compiler/language-service performance improvements, but it also says stable programmatic APIs come later. Typed should keep its current TS 5/6 JavaScript API integration stable and avoid depending on TS7-only APIs in this PR.

Implication: TS7/`tsgo` should influence the architecture boundary: keep host/cache/config logic clean enough to adapt later, but do not block this release on native TypeScript support.

### 8. Incremental correctness depends on complete dependency modeling.

Riker and Build Systems à la Carte both reinforce the same engineering rule for this workflow: fast rebuilds are only safe when dependencies and invalidation semantics are explicit. Typed already has dependency descriptors from TypeInfoApi and artifact manifests, so requirements should push all hosts through the same dependency model rather than one-off refresh heuristics.

Implication: cache hits must be invalidated by plugin/config/compiler/source dependency fingerprints, not just project-root or timestamp heuristics.

## Open Risks and Unknowns

- Need exact dependency-closure semantics for production import precision:
  - direct named import only;
  - requested export plus plugin-declared internal dependencies;
  - TypeInfo-discovered route/API/app graph reachability;
  - or a combined model.
- Need to inspect every first-party plugin for all-export production behavior, not only HttpApi.
- Need measured TS plugin and VS Code hot-path timings before setting final latency budgets.
- Need to decide whether config convergence lands as a shared loader package/API or as narrower helper exports from `@typed/app`/`@typed/virtual-modules`.
- Need live Storybook dev reliability evidence, not only story build/typecheck scripts.
- Need to clean stale `.typed` artifacts before trusting generated-output scans.

## Implications for Requirements and Specification

- Add a shared production import-precision requirement for every first-party virtual-module plugin.
- Add plugin-level tests that assert generated source excludes unused imports/exports/helper code for production build contexts.
- Add type-level tests that assert generated public surfaces preserve request, success, error, and service types without `any`/`unknown` erasure.
- Remove `TypedClient`/`makeTypedClient*` from HttpApi generated output and Storybook re-exports.
- Define `typed.config.ts` as the canonical product config source; Vite, Storybook, `vmc`, TS plugin, and VS Code adapt it.
- Require TS plugin performance instrumentation before optimization.
- Require VS Code virtual-module tree/preview/definition paths to share the resolver/artifact/cache substrate or document why they cannot.
- Require Storybook dev/build/story typecheck to use the same generated contracts as app surfaces.
- Require cache correctness tests for config/plugin/source dependency changes across `vmc`, Vite, TS plugin, and VS Code.

## Alignment Notes

- specs_alignment:
  - Aligns with `.docs/specs/virtual-modules/spec.md` by extending dependency descriptors and TypeInfo sessions into production import precision and shared host cache behavior.
  - Aligns with `.docs/specs/typed-devtools/spec.md` by treating Storybook/DevTools fixtures as insufficient for live capability proof.
- adrs_alignment:
  - Aligns with `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`: Storybook is a consumer of app virtual modules; developer tooling owns host integration.
  - Aligns with `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`: `@typed/compiler` stays focused on static facts and generated output; `vmc` remains the host adapter.
- workflows_alignment:
  - Refines `.docs/workflows/20260524-1047-cohesion-remediation-plan/requirements.md` by replacing "TypedClient may remain if type-safe" with the stronger approved rule: `TypedClient` must not remain.
  - Confirms the current workflow's Phase 1 hard lines: host stability, Storybook reliability, config DRYness, type safety, and import-precise production output.

## Memory Promotion Candidates

- procedural, confidence high: before trusting virtual-module production output, scan generated source and regenerated `.typed` artifacts for stale broad exports and stale wrapper types.
- heuristic, confidence high: bundler tree-shaking is not a substitute for import-precise generated source because type errors and server-only imports can enter the graph before bundling.
- heuristic, confidence medium: VS Code should present shared virtual artifacts rather than owning a separate program/config/cache model; any separate cache should be presentation-only.
- mistake, confidence high: allowing "thin" generated client wrappers creates pressure to preserve ergonomic aliases that still lose generic method parameters; prefer raw `HttpApiClient.ForApi` surfaces.
