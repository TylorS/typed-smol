## Research Questions

- RQ-1: Which current `@typed/compiler` pieces are necessary for both all-template optimization and HMR, and which are accidental complexity?
- RQ-2: What current repo surfaces already support `RefSubject` service identity and HMR state reuse?
- RQ-3: What does current Vite HMR require for state persistence, cleanup, invalidation, and plugin-driven update handling?
- RQ-4: What TypeScript compiler APIs should replace regex source scanning for trustworthy HMR eligibility analysis?
- RQ-5: How should the simplification preserve virtual-module-first and artifact-store constraints?
- RQ-6: What does Qwik-style resumability imply for Typed route-module closure transformation?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| `packages/compiler/src/template/TemplatePlan.ts` | 2026 | repo code | high | Defines the current target-neutral template plan, but mixes structural nodes and runtime part descriptors in one broad model. |
| `packages/compiler/src/template/analyzeTemplate.ts` | 2026 | repo code | high | Converts `@typed/template` parser output into `TemplatePlan`; this is the most reusable all-`html` optimization entrypoint. |
| `packages/compiler/src/template/emitDomTemplate.ts` | 2026 | repo code | high | DOM target currently acts like a runtime renderer, including attribute/event/ref setup and value resolution. |
| `packages/compiler/src/template/emitServerTemplate.ts` | 2026 | repo code | high | Server target separately implements string rendering and escaping, creating equivalence pressure against DOM/runtime paths. |
| `packages/compiler/src/hmr/analyzeComponentHmr.ts` | 2026 | repo code | high | HMR eligibility currently uses regexes for `RefSubject.make` and `RefSubject.Service`; this is the highest-risk simplification target. |
| `packages/compiler/src/hmr/dependencies.ts` | 2026 | repo code | high | Dependency participation already distinguishes explicit opt-out, anonymous state rejection, and service-backed state. |
| `packages/compiler/src/hmr/viteHmr.ts` | 2026 | repo code | high | Current HMR plan emits Vite runtime glue around descriptors and registry reuse. |
| `packages/compiler/src/capabilities/compileCapabilities.ts` | 2026 | repo code | high | Centralizes template and HMR capability planning, but does not yet own source-backed analysis or a unified compiler model. |
| `packages/compiler/src/cps/planCpsCompilation.ts` | 2026 | repo code | high | Existing CPS scaffold lowers template output and HMR state into continuations, but does not yet transform route-module closures. |
| `packages/compiler/src/hmr/closureContext.ts` | 2026 | repo code | high | Existing closure-context planning can represent captures as generated context fields and reject mutable captures. |
| `packages/app/src/runtime/hmrRegistry.ts` | 2026 | repo code | high | Runtime HMR registry already supports module/service keys, compatibility fingerprints, hot data, globals, disposal, and pruning. |
| `packages/app/src/runtimeTemplates/hmrRegistry.ts` | 2026 | repo code | high | Duplicates the runtime HMR registry surface, creating simplification work in `@typed/app`. |
| `packages/fx/src/RefSubject/RefSubject.ts` | 2026 | repo code | high | `RefSubject.Service` exists and exposes stable `id`, `service`, `layer`, and `make` surfaces. |
| `packages/fx/src/RefSubject.Service.test.ts` | 2026 | repo test | high | Proves stable service IDs and type preservation for value, error, and service requirements. |
| `packages/app/src/runtimeTemplateCompilerExample.ts` | 2026 | repo code | high | Demonstrates server render, DOM hydrate, and route-service HMR planning together, but still uses string source fixtures. |
| `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md` | 2026 | accepted ADR | high | Requires explicit virtual modules and rejects filesystem routing. |
| `.docs/adrs/20260515-2018-virtual-module-artifact-store.md` | 2026 | accepted ADR | high | Requires fingerprinted generated artifact correctness where materialization is involved. |
| `.docs/specs/virtual-modules/spec.md` | 2026 | durable spec | high | Defines virtual module identity, compiler-host and language-service adapter invariants, and watch invalidation responsibilities. |
| [Vite HMR API](https://vite.dev/guide/api-hmr) | 2026 | official docs | high | `import.meta.hot.data` persists per-module data; HMR code should be guarded; `accept`, `dispose`, `prune`, and `invalidate` define update lifecycle. |
| [Vite Plugin API](https://vite.dev/guide/api-plugin#handlehotupdate) | 2026 | official docs | high | `handleHotUpdate` can filter modules, invalidate, trigger full reload, or send custom client events. |
| [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) | current | official vendor docs | high | Supports `createProgram`, compiler hosts, type checking, AST traversal via `forEachChild`, and source-file analysis. |
| [Qwik resumable concepts](https://qwik.dev/docs/concepts/resumable/) | 2026 | official docs | high | Defines resumability as serializing enough listener/component/state information to resume without replaying hydration. |
| [Qwik optimizer tutorial](https://qwik.dev/tutorial/qrl/optimizer/) | 2026 | official docs | high | Describes optimizer closure handling, lazy-loaded boundaries, and lexical-scope restoration as core to resumability. |
| [Qwik QRL docs](https://qwik.dev/docs/advanced/qrl/) | 2026 | official docs | high | QRLs encode lazy chunk/symbol references plus lexical-capture indexes so closures can be restored. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `research paper hot module replacement state preservation JavaScript modules` | Look for primary research on state-preserving HMR beyond framework docs. | No directly actionable modern Typed/Vite-equivalent paper found; Vite docs remain the practical primary source for this tranche. |
| `research paper incremental DOM template compilation HTML templates JavaScript` | Check whether current papers should affect template IR design. | General template/incremental rendering papers found, but no primary source changed the immediate repo-grounded requirements. |
| `Vite HMR API import.meta.hot.data dispose prune invalidate official docs` | Verify current Vite HMR lifecycle. | [Vite HMR API](https://vite.dev/guide/api-hmr). |
| `Qwik resumability closures QRL optimizer official docs` | Ground the user's "Qwik meaning of resumable" in primary docs. | [Qwik resumable concepts](https://qwik.dev/docs/concepts/resumable/), [Qwik optimizer tutorial](https://qwik.dev/tutorial/qrl/optimizer/), [Qwik QRL docs](https://qwik.dev/docs/advanced/qrl/). |

## Key Findings

- The current compiler already has the right broad pieces: template analysis, DOM/server output, route/dependency HMR analysis, Vite HMR runtime emission, closure context planning, and capability planning.
- The roughness is mostly shape and ownership, not missing concepts. `TemplatePlan`, HMR descriptors, dependency descriptors, and capability plans overlap without one small compiler model owning the shared facts.
- The first simplification should remove HMR blockers while preserving all-template optimization. That means replacing regex HMR scanning with TypeScript AST/type-checker-backed analysis before adding more HMR behavior.
- `RefSubject.Service` already exists and is tested. HMR work should lean on stable service IDs instead of inventing lexical key identity as the primary model.
- `@typed/app` has duplicated `runtime` and `runtimeTemplates` surfaces. The HMR registry duplication is nearly identical and should be collapsed or routed to one canonical runtime surface before expanding HMR integration.
- Vite requires HMR usage to be guarded for production tree-shaking, treats `hot.accept()` as the boundary marker, preserves `hot.data` by mutation across module instances, and provides `dispose`/`prune` cleanup plus `invalidate` fallback.
- Vite plugin `handleHotUpdate` gives the server-side hook needed to filter affected modules or force reload/custom events when Typed compatibility checks fail.
- TypeScript compiler APIs are the correct substrate for route/dependency participation and `RefSubject` identity analysis because they support source-file traversal, type checker access, diagnostics, and custom compiler hosts already aligned with `vmc`.
- Current DOM/server emitters are useful as reference adapters and equivalence-test targets, but they should not grow into two independent runtime renderers.
- Artifact-store integration should remain fingerprint-driven and fail-closed only when compiler output is materialized or reused across hosts; early in-memory simplification can still compute fingerprints.
- Qwik-style resumability is not only state preservation. It requires making listeners/entrypoints, component or route boundaries, and application state/captures addressable without replaying all component code.
- Qwik's optimizer model maps well to Typed route modules if route closures become explicit continuations and lexical captures are lowered into generated context/service descriptors instead of hidden heap captures.
- Typed should not copy Qwik's QRL format directly. The analogous Typed primitive should be a virtual-module/artifact-store continuation descriptor with chunk/symbol identity, closure-capture context, service requirements, and `RefSubject.Service` state identities.
- The existing `planCpsCompilation` and `closureContext` files are the right seed, but they need to move from capability lowering to route-module closure transformation.

## Open Risks and Unknowns

- The exact minimal shared compiler model is not yet specified.
- Whether source analysis should live entirely in `@typed/compiler` or share `TypeInfoApi` helpers with `vmc` needs specification.
- Closure-context planning exists but may distract from the first HMR-enabling simplification if it is expanded too early.
- The user clarified closure CPS transformation is not optional or late; it is the route-module resumability mechanism. The risk is now over-narrowing it to event handlers instead of all route-module closures.
- The duplicated runtime surfaces may be user-visible; cleanup needs API compatibility or a clear deprecation/removal decision.
- Vite virtual-module invalidation edge cases should be tested in this repo before relying only on client `invalidate`.

## Implications for Requirements and Specification

- Requirements should prioritize an AST/type-checker-backed HMR analysis pipeline before broader HMR state behavior.
- Requirements should require one canonical runtime HMR registry export path.
- Requirements should preserve `RefSubject.Service` as the primary HMR state identity.
- Requirements should make route-module resumability a first-class goal: every route-module closure is analyzed and either lowered to a continuation with explicit context/service captures or rejected with actionable diagnostics.
- Requirements should define Effect `Context` and `RefSubject.Service` as the main capture carriers for CPS-transformed closures.
- Requirements should keep all `html` templates on one compiler path, even when stateful HMR applies only to route/dependency boundaries.
- Specification should define a small shared compiler model that target emitters and HMR planning both consume.
- Specification should treat current DOM/server emitters as target adapters over shared data, not separate source-of-truth renderers.
- Specification should define a Typed continuation descriptor analogous to Qwik's QRL role, but expressed through virtual-module identities, generated symbols, context capture records, and service fingerprints.

## Alignment Notes

- specs_alignment:
  - Aligns with `.docs/specs/virtual-modules/spec.md` by using TypeScript program/host-based analysis rather than an unrelated parser path.
  - Aligns with `.docs/specs/virtual-module-artifact-store/spec.md` by keeping materialized output fingerprinted and fail-closed.
- adrs_alignment:
  - Aligns with `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`; no filesystem routing is introduced.
  - Aligns with `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`; generated output reuse depends on compiler/input fingerprints.
- workflows_alignment:
  - Builds on `.docs/workflows/20260521-2320-runtime-template-compiler/` as reference context only.
  - Updates this run's direction based on the human clarification that all-template optimization and HMR progress should advance together, with first bits enabling HMR.

## Memory Promotion Candidates

- heuristic: For future `@typed/compiler` work, do not split template optimization and HMR into separate compiler paths; use one shared compiler substrate and narrower stateful HMR eligibility. Confidence: high after requirements approval.
- heuristic: Treat regex-based HMR analysis as temporary scaffolding; route/dependency HMR eligibility should be backed by TypeScript AST/type-checker evidence. Confidence: high after requirements approval.
- heuristic: Route-module resumability means closure capture lowering, not just `RefSubject` state reuse; use generated Effect contexts and `RefSubject.Service` identities as explicit continuation inputs. Confidence: high after requirements approval.
- procedural: Collapse duplicated `@typed/app` runtime HMR registry surfaces before expanding generated HMR glue. Confidence: medium until implementation confirms public API impact.
