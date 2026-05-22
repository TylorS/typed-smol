# Requirements - Runtime Template Compiler

Status: draft, pending human approval.

## Source Grounding

- Repo surfaces:
  - `packages/app/src/internal/emitBrowserSource.ts`
  - `packages/app/src/internal/emitServerSource.ts`
  - `packages/app/src/internal/frameworkVirtualModuleId.ts`
  - `packages/template/src/RenderTemplate.ts`
  - `packages/template/src/Render.ts`
  - `packages/template/src/Html.ts`
  - `packages/template/src/Parser.ts`
  - `packages/fx/src/Fx/constructors/fn.ts`
  - `packages/fx/src/RefSubject/RefSubject.ts`
  - `packages/virtual-modules-compiler/src/compile.ts`
  - `packages/virtual-modules-vite/src/vitePlugin.ts`
  - `packages/vite-plugin/src/index.ts`
- Durable specs and ADRs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/virtual-module-artifact-store/spec.md`
- Current external sources:
  - Vite HMR API: `https://vite.dev/guide/api-hmr`
  - Vite plugin HMR hook docs: `https://vite.dev/guide/api-plugin`
  - TypeScript compiler API: `https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API`

## Functional Requirements

- FR-1: The system shall expose first-class `@typed/app` runtime functions for DOM mount, DOM hydrate, server render, and runtime/compiler handoff without requiring users to import lower-level `@typed/template` services for common app entrypoints.
- FR-2: The system shall preserve the existing explicit virtual-module-first architecture; new runtime and compiler entrypoints shall integrate through explicit imports and generated virtual modules rather than filesystem routing.
- FR-3: The system shall introduce `@typed/compiler` as the public package surface for Typed app/template compilation.
- FR-4: `@typed/compiler` shall compile all `@typed/template` `html` templates into a typed intermediate representation before emitting target-specific output.
- FR-5: `@typed/compiler` shall emit server-target output optimized for HTML string/stream rendering.
- FR-6: `@typed/compiler` shall emit DOM-target output optimized for mount/hydration and fine-grained dynamic part updates.
- FR-7: Compiler output shall preserve `Effect` error and context requirements from interpolated `Renderable`, `Fx`, `Effect`, and event-handler values.
- FR-8: Compiler output shall preserve `Fx` success/error/context types when templates are produced by `Fx.gen` or `Fx.fn`.
- FR-9: The compiler shall support a compatibility fallback to the existing runtime `RenderTemplate` path when a template or program is outside the first supported optimization set.
- FR-10: `@typed/app` runtime functions shall accept compiler-generated template implementations and runtime-rendered templates through the same public API shape where feasible.
- FR-11: The system shall define an HMR state contract for eligible `RefSubject` values used inside `Fx.gen` / `Fx.fn` programs.
- FR-12: HMR state preservation shall use Vite's `import.meta.hot.data` as the dev-time persistence substrate when Vite HMR is available.
- FR-13: HMR state preservation shall require a stable state key and a compatible state-shape/version check before restoring a `RefSubject`.
- FR-14: HMR state preservation shall invalidate or fall back to fresh initialization when compatibility cannot be proven.
- FR-15: The runtime shall register HMR dispose/prune cleanup for preserved state and long-lived render resources.
- FR-16: The compiler/runtime design shall make the boundary between `@typed/compiler` and the existing `@typed/virtual-modules-compiler` explicit.
- FR-17: The existing `@typed/virtual-modules-compiler` shall remain the `vmc` TypeScript compiler-host adapter unless this workflow explicitly approves a migration.
- FR-18: Compiler-generated artifacts shall integrate with the existing virtual artifact store when disk materialization or cross-host reuse is required.
- FR-19: The Vite integration shall keep all first-party `@typed/app` virtual module plugins enabled and preserve current plugin ordering constraints.
- FR-20: Generated code shall be executable, type-safe TypeScript; it shall not rely on untyped JS-like emitted strings or broad `any` casts for public contracts.
- FR-21: The first implementation slice shall include a runnable example or fixture demonstrating DOM render/hydration plus at least one preserved `RefSubject` across HMR-compatible reload.
- FR-22: The first implementation slice shall include server-render fixture coverage for the same template IR or compiler contract used by the DOM target.
- FR-23: `@typed/fx` / `@typed/app` shall provide or expose a `RefSubject.Service` pattern so stateful template/app refs can be represented as injectable services instead of anonymous inline refs.
- FR-24: The compiler/runtime shall be able to replace eligible inline `RefSubject.make(...)` usage with service-backed refs when a stable service identity can be derived or supplied.
- FR-25: HMR preservation shall prefer service-backed `RefSubject` identity over raw lexical keys; lexical/compiler-generated keys are fallback metadata, not the primary state model.
- FR-26: In Vite HMR, preserved `RefSubject.Service` instances or their compatible state snapshots shall be attached to a module/global dev registry that survives accepted updates and is cleaned on prune.
- FR-27: The compiler shall support, or explicitly stage toward, HMR-stable component-local closures by replacing eligible closure captures/arguments with a generated typed context object.
- FR-28: Generated closure context objects shall preserve the original closure's value, error, and service requirements, and shall remain compatible with `Fx.gen` / `Fx.fn` typing.
- FR-29: Closure-to-context rewriting shall apply only when the compiler can prove capture identity and context shape compatibility; otherwise it shall preserve the original closure path or invalidate HMR.
- FR-30: HMR state preservation shall be limited to components with compiler-visible state boundaries, especially route components; generic `html` template optimization shall not imply HMR state preservation.
- FR-31: Route components shall be the primary first-class target for stateful HMR because router integration provides a stable component/module boundary for `RefSubject.Service` and generated closure context identity.
- FR-32: Stateful HMR eligibility shall include route components and their compiler-visible dependency modules when those dependencies participate in the component state boundary.
- FR-33: The compiler/runtime shall track dependency-module fingerprints for HMR-preserved component state and invalidate preserved state when a dependency changes in a way that makes state shape or closure context incompatible.
- FR-34: Dependency-boundary HMR shall preserve state only for dependencies that expose stable service/context identities; anonymous or ambiguous dependency state shall remain non-preserved.
- FR-35: The compiler shall infer dependency participation by default from route/component source, companion files, and import graph evidence.
- FR-36: Users shall be able to explicitly opt dependency modules/components into or out of stateful HMR when inference is wrong or undesired.

## Non-Functional Requirements

- NFR-1: Compiler output shall be deterministic for the same source, config, plugin, TypeScript, and compiler inputs.
- NFR-2: Compiler cache reuse shall fail closed using source/config/plugin/compiler fingerprints and shall not trust stale process-local records.
- NFR-3: Runtime functions shall keep functions small and locally testable; runtime functions introduced in app/compiler packages should stay near 20-30 lines unless a clear local pattern justifies otherwise.
- NFR-4: The compiler shall avoid broad TypeScript optimizer scope; the first tranche is limited to Typed templates and Typed runtime handoff code.
- NFR-5: HMR state preservation shall be dev-only and shall not change production semantics.
- NFR-6: HMR state restoration shall be explicit and inspectable; silent restoration of incompatible state is forbidden.
- NFR-7: The system shall preserve interruption and scope cleanup semantics for DOM render fibers, event listeners, and server rendering resources.
- NFR-8: The system shall avoid introducing hidden global singleton state except where Vite HMR requires `import.meta.hot.data`, and that state must be scoped by module/key/version.
- NFR-9: Requirements, specification, plan, and execution tasks shall preserve traceability from FR/NFR IDs to acceptance criteria and implementation tasks.
- NFR-10: The design shall remain compatible with Vite dev/build, `vmc`, TypeScript language-service plugin usage, and VS Code virtual preview paths where the existing virtual-module substrate supports them.
- NFR-11: Test coverage shall favor property tests for compiler IR/render equivalence where practical, plus compile-time positive/negative type tests for public API contracts.
- NFR-12: The workflow shall record short-term lessons in `memories.md` during execution and promote only durable lessons through the finalization memory process.
- NFR-13: Dev global/HMR registries shall be namespaced, versioned, and inspectable; production builds must tree-shake or omit the registry path.
- NFR-14: Closure rewriting shall be opt-in or compiler-proven; arbitrary closure serialization is forbidden.

## Acceptance Criteria

- AC-1: (maps to FR-1, FR-10, FR-20) `@typed/app` exports runtime functions for mount, hydrate, and server render with type-safe signatures covered by compile-time tests.
- AC-2: (maps to FR-3, FR-4, FR-5, FR-6, FR-16, FR-17) `@typed/compiler` package boundary is specified and implemented or stubbed with a tested public API that does not replace `vmc` accidentally.
- AC-3: (maps to FR-4, FR-5, FR-6, NFR-1, NFR-4) Template compiler fixtures prove static, dynamic, event, ref, sparse-part, and nested `html` templates compile into deterministic server and DOM target outputs.
- AC-4: (maps to FR-7, FR-8, FR-20, NFR-11) Compile-time tests prove generated/runtime APIs preserve `Effect` and `Fx` success/error/context types for interpolations and `Fx.fn` / `Fx.gen` authored templates.
- AC-5: (maps to FR-9) Unsupported template/program shapes fall back to the existing `RenderTemplate` runtime path with a structured reason or explicit diagnostic.
- AC-6: (maps to FR-11, FR-12, FR-13, FR-14, FR-23, FR-24, FR-25, FR-26, FR-30, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, NFR-5, NFR-6, NFR-8, NFR-13) HMR tests or fixtures prove compatible route-component and dependency-module `RefSubject.Service` state is restored through the dev registry / `import.meta.hot.data`, while plain optimized `html` templates do not receive stateful HMR unless they are part of an eligible component/dependency boundary; fixtures also prove explicit opt-out prevents preservation.
- AC-7: (maps to FR-15, NFR-7) HMR dispose/prune behavior cleans up runtime resources and does not leak event listeners or render fibers in the tested fixture.
- AC-8: (maps to FR-18, NFR-1, NFR-2, NFR-10) Artifact-store integration either materializes compiler output with fingerprints or explicitly documents why the first slice remains in-memory only.
- AC-9: (maps to FR-19, NFR-10) `@typed/vite-plugin` continues registering all `@typed/app` virtual-module plugins in the existing order unless a specification-approved change updates that invariant.
- AC-10: (maps to FR-21, FR-22) A runnable example or integration fixture demonstrates the same compiler/runtime contract across DOM/hydration and server output.
- AC-11: (maps to NFR-9, NFR-12) Planning and execution artifacts link tasks back to requirement IDs and record reusable implementation lessons.
- AC-12: (maps to FR-27, FR-28, FR-29, NFR-14) A compiler fixture demonstrates an eligible component closure rewritten through a generated context object, plus a negative fixture proving unsupported closures are not rewritten.

## Prioritization

- must_have:
  - FR-1 through FR-18
  - FR-20
  - FR-21 through FR-36
  - AC-1 through AC-8
  - AC-10
  - AC-12
  - NFR-1 through NFR-9
- must_have_notes:
  - Full `html` template optimization is required in this workflow, not a representative-subset proof only.
  - The implementation plan is expected to be a multi-day staged plan with sequential tasks.
- should_have:
  - FR-19
  - AC-9
  - NFR-10
  - NFR-11
- could_have:
  - NFR-12 before finalization if execution creates reusable lessons.

## Design Choices Requiring Human Decision

### DC-1: `@typed/compiler` Package Boundary

- Option A: New focused package for template/app compilation that integrates with `vmc`.
- Option B: Public facade over `@typed/virtual-modules-compiler` plus compiler helpers.
- Option C: Defer package creation and land runtime/compiler hooks in `@typed/app` first.

Recommended: Option A.

Decision: Option A approved by the human. `@typed/compiler` is a new focused package for template/app compilation that integrates with, but does not replace, `@typed/virtual-modules-compiler`.

### DC-2: HMR State Keys

- Option A: Explicit user-provided keys for preserved `RefSubject` state.
- Option B: Compiler-generated keys from module path, lexical location, and state index.
- Option C: Hybrid explicit keys when provided, compiler-generated keys otherwise.
- Option D: Service-first identity using `RefSubject.Service`, with lexical/compiler-generated keys only as fallback metadata for service construction and diagnostics.

Recommended: Option D, with state-shape/version checks always required.

Decision: The human wants a `RefSubject.Service` pattern that replaces inline refs and attaches reusable state to a dev global/HMR registry for reuse after HMR. Requirements FR-23 through FR-26 capture this as the preferred HMR model.

### DC-3: Component Closure HMR

- Option A: Treat component-local closure rewriting as first-slice scope.
- Option B: Specify the closure-to-context transform now, but implement after service-backed `RefSubject` HMR works.
- Option C: Defer closure rewriting entirely.

Recommended: Option B. The transform is architecturally important, but service-backed refs are the simpler proof boundary.

Decision: The human identified generated context objects as the path for preserving component-local closures. Requirements FR-27 through FR-29 and AC-12 capture this direction.
Sequencing: Option B approved by the human. Specify closure-to-context rewriting now, but implement it after service-backed `RefSubject` HMR is working.

### DC-4: Optimization Boundary Versus HMR Boundary

- Template optimization: all `html` templates are compiler targets.
- Stateful HMR: only components with compiler-visible state boundaries, especially route components and participating dependencies, are HMR state targets.

Decision: Approved by the human. Do not conflate general template optimization with state-preserving HMR.

### DC-5: Dependency HMR Participation Controls

- Default: infer dependency participation from route/component source, companion files, and import graph evidence.
- Override: users can explicitly opt dependency modules/components in or out when inference is wrong or when preservation is unwanted.

Decision: Approved by the human.

### DC-6: Full Template Optimization Scope

- Requirement: all `html` template forms are in scope for optimization in this workflow.
- Planning implication: the implementation plan should be substantial and staged over many sequential tasks rather than narrowed to a proof-only subset.

Decision: Approved by the human.
