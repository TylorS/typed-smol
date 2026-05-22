# Requirements - Runtime Compiler Simplification

Status: approved by human on 2026-05-22.

## Functional Requirements

- FR-1: The compiler shall optimize all `@typed/template` `html` templates through one shared compiler substrate across server, DOM, and future supported environments.
- FR-2: Stateful HMR shall remain a narrower capability than template optimization and shall apply only to route components and participating dependencies with compiler-visible state boundaries.
- FR-3: The first implementation tasks shall prioritize simplifications that unblock `RefSubject` HMR while preserving the all-template optimization path.
- FR-4: The compiler shall replace regex-only HMR source scanning with TypeScript AST and, where necessary, type-checker-backed analysis.
- FR-5: The compiler shall enable route modules to be resumable in the Qwik sense: route behavior, listeners/entrypoints, and captured state must be representable without replaying the whole route module during resume.
- FR-6: The compiler shall analyze every compiler-visible closure in a route module and classify it as resumable, context-required, service-required, or unsupported.
- FR-7: The compiler shall transform resumable route-module closures through a CPS-style lowering into explicit continuation descriptors.
- FR-8: CPS continuation descriptors shall include module identity, generated symbol identity, closure kind, explicit capture records, required Effect services, referenced `RefSubject.Service` identities, template dependencies, and compatibility fingerprints.
- FR-9: Closure captures shall be lowered into generated Effect `Context` services and/or existing `RefSubject.Service` identities when they are needed for resume/HMR.
- FR-10: Mutable, anonymous, non-serializable, or otherwise unsupported captures shall produce diagnostics instead of being silently preserved as hidden heap state.
- FR-11: HMR analysis shall detect `RefSubject.Service` identities as the preferred stable state identity.
- FR-12: HMR analysis may detect inline `RefSubject.make(...)` as a migration/diagnostic case, but inline refs shall not be treated as the preferred preservation model.
- FR-13: The compiler shall produce one shared route/dependency/resumability descriptor model consumed by Vite runtime emission, dependency participation, CPS planning, and capability planning.
- FR-14: The compiler shall preserve explicit dependency participation controls: inferred participation, explicit opt-in, and explicit opt-out.
- FR-15: Dependency HMR participation shall reject anonymous `RefSubject` state unless it can be migrated to a stable service identity.
- FR-16: Vite HMR runtime output shall use guarded `import.meta.hot` code, mutate `hot.data` rather than reassigning it, and register cleanup through dispose/prune paths.
- FR-17: HMR compatibility shall be checked by module identity, generated symbol identity, service identity, capture/context fingerprint, state-shape fingerprint, dependency fingerprints, and compiler/runtime version.
- FR-18: HMR shall invalidate or fall back to fresh initialization when compatibility cannot be proven.
- FR-19: `@typed/app` shall expose one canonical HMR/resume registry runtime surface; duplicated `runtime` and `runtimeTemplates` registry implementations shall be collapsed or routed through one owner.
- FR-20: `RefSubject.Service` shall remain the primary API for stable state identity and shall preserve value, error, and service typing.
- FR-21: Effect `Context` shall be the primary API for explicit dependency/capture records produced by closure CPS lowering.
- FR-22: Template analysis shall continue to support the existing parsed `html` forms: static nodes, dynamic nodes, text parts, comment parts, sparse text/comment/attributes, boolean attributes, class/data/property/properties attributes, event handlers, refs, self-closing elements, text-only elements, and doctypes.
- FR-23: DOM and server targets shall consume shared compiler data and avoid growing separate source-of-truth template semantics.
- FR-24: Server output shall preserve escaping and marker semantics proven against the current runtime HTML renderer.
- FR-25: DOM output shall preserve mount/hydration-relevant behavior for dynamic parts, attributes, events, refs, and multi-root boundaries proven against the current DOM renderer.
- FR-26: `@typed/compiler` shall remain a focused template/app compiler package and shall not replace `@typed/virtual-modules-compiler` or `vmc`.
- FR-27: Generated or emitted compiler artifacts shall remain compatible with the virtual-module-first architecture and shall not introduce filesystem routing.
- FR-28: Materialized compiler output shall integrate with the virtual artifact store using source/config/plugin/compiler fingerprints.
- FR-29: Unsupported or not-yet-optimized template/program shapes shall produce a structured fallback reason instead of silently using an unclear path.

## Non-Functional Requirements

- NFR-1: Simplification shall reduce duplicated compiler/runtime concepts rather than adding new parallel descriptor models.
- NFR-2: Compiler functions introduced or rewritten in this workflow should stay small, locally testable, and focused on one transformation or decision.
- NFR-3: Source analysis shall be deterministic for the same source text, compiler options, TypeScript version, virtual module inputs, and plugin inputs.
- NFR-4: HMR preservation shall be dev-only and shall not alter production runtime semantics.
- NFR-5: HMR state restoration shall be inspectable and fail closed.
- NFR-6: Tests shall favor equivalence/property-style coverage for template compilation where practical.
- NFR-7: Tests shall include focused positive and negative coverage for HMR eligibility, opt-in, opt-out, anonymous state rejection, and compatibility mismatch.
- NFR-8: Effect, Fx, and Renderable success/error/service typing shall be preserved across public compiler/runtime APIs.
- NFR-9: Runtime cleanup shall preserve scope, event-listener, render-fiber, and HMR registry disposal semantics.
- NFR-10: The workflow shall maintain traceability from requirements to specification, plan, tasks, and verification evidence.

## Acceptance Criteria

- AC-1: (maps to FR-1, FR-22, FR-23, FR-24, FR-25, NFR-6) Template tests prove the shared compiler substrate produces server and DOM behavior equivalent to current runtime rendering for the supported `html` forms.
- AC-2: (maps to FR-4, FR-11, FR-12, FR-13, NFR-3, NFR-7) HMR analysis tests prove AST/type-checker-backed detection of `RefSubject.Service`, diagnostic handling of inline `RefSubject.make`, and no dependency on regex-only scanning.
- AC-3: (maps to FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-21, NFR-7, NFR-8) Route-module CPS tests prove closures are classified, eligible closures lower to continuation descriptors with explicit Effect Context / `RefSubject.Service` captures, and unsupported captures produce diagnostics.
- AC-4: (maps to FR-2, FR-14, FR-15, NFR-7) Dependency participation tests prove inferred participation, explicit opt-in, explicit opt-out, and anonymous state rejection.
- AC-5: (maps to FR-16, FR-17, FR-18, NFR-4, NFR-5, NFR-9) Vite HMR runtime tests prove guarded hot usage, hot-data registry reuse, dispose/prune cleanup, and invalid/fresh-state fallback on compatibility mismatch.
- AC-6: (maps to FR-19, NFR-1) `@typed/app` has one canonical HMR/resume registry runtime implementation, with duplicate surfaces removed or forwarded through one owner and tests covering public imports.
- AC-7: (maps to FR-20, FR-21, NFR-8) Type tests prove `RefSubject.Service` state identity and generated Effect Context captures preserve value, error, and service requirements through compiler/runtime APIs.
- AC-8: (maps to FR-26, FR-27, FR-28) Compiler integration tests or docs prove `@typed/compiler` remains separate from `vmc`, preserves virtual-module-first imports, and fingerprints materialized artifacts when artifact-store integration is used.
- AC-9: (maps to FR-29) Fallback tests prove unsupported template/program shapes return structured reasons.
- AC-10: (maps to FR-3, NFR-10) The implementation plan orders early tasks around route-module resumability and HMR-enabling simplifications while keeping each task linked to all-template optimization requirements.

## Prioritization

- must_have:
  - FR-1 through FR-21
  - FR-26 through FR-29
  - NFR-1 through NFR-5
  - NFR-8 through NFR-10
  - AC-2 through AC-10
- should_have:
  - FR-22 through FR-25
  - NFR-6
  - NFR-7
  - AC-1
- could_have:
  - Additional property-test generators for every template node kind if focused fixtures already prove the first implementation slice.

## Approval Gate

Before exiting requirements, the human must explicitly approve this `requirements.md` or request revisions.
