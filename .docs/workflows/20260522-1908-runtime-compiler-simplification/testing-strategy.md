# Testing Strategy - Runtime Compiler Simplification And Route Resumability

Status: approved by human on 2026-05-22.

## Test Type Taxonomy

- unit:
  - template model conversion;
  - route analyzer facts;
  - closure classification;
  - CPS continuation descriptor planning;
  - HMR compatibility fingerprinting;
  - runtime registry reuse/dispose/prune behavior.
- integration:
  - route module fixture through analyzer -> CPS planner -> virtual output;
  - optimized server and DOM output equivalence for one template model;
  - Vite HMR fixture with compatible and incompatible updates;
  - `@typed/app` public runtime import compatibility after registry canonicalization.
- e2e:
  - minimal Typed app route fixture proving state survives a compatible HMR update and invalidates on incompatible closure/context changes.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Compile representative `html` templates into the shared model and prove server/DOM behavior matches runtime renderers. | FR-1, FR-22, FR-23, FR-24, FR-25, NFR-6 | AC-1 | yes |
| TS-2 | Analyze a route module with `RefSubject.Service` using TS AST/type checker and emit stable HMR facts without regex source truth. | FR-4, FR-11, FR-12, FR-13, NFR-3, NFR-7 | AC-2 | yes |
| TS-3 | Lower route closures with Effect service captures and `RefSubject.Service` captures into CPS continuation descriptors. | FR-5, FR-6, FR-7, FR-8, FR-9, FR-21, NFR-8 | AC-3, AC-7 | yes |
| TS-4 | Reject mutable/anonymous/non-serializable closure captures with structured diagnostics. | FR-10, FR-29, NFR-5, NFR-7 | AC-3, AC-9 | yes |
| TS-5 | Prove dependency participation inference, opt-in, opt-out, anonymous state rejection, recursive traversal, cycle termination, and transitive dependency descriptor inclusion. | FR-2, FR-14, FR-15, FR-15a, NFR-3, NFR-7 | AC-4, AC-4a | yes |
| TS-6 | Restore compatible HMR state through hot-data registry and fresh-initialize or invalidate on compatibility mismatch. | FR-16, FR-17, FR-18, NFR-4, NFR-5, NFR-9 | AC-5 | yes |
| TS-7 | Collapse or forward duplicate `@typed/app` HMR registry surfaces and prove public imports behave consistently. | FR-19, NFR-1 | AC-6 | yes |
| TS-8 | Preserve value/error/service typing for generated Effect contexts and `RefSubject.Service` state identities. | FR-20, FR-21, NFR-8 | AC-7 | yes |
| TS-9 | Prove compiler output remains virtual-module-first and separate from `vmc`; materialized output uses fingerprints when artifact store is involved. | FR-26, FR-27, FR-28 | AC-8 | yes |
| TS-10 | Plan execution tasks so route resumability/HMR-enabling work comes first without splitting all-template optimization onto a separate path. | FR-3, NFR-10 | AC-10 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking `TS-*` scenarios must pass before finalization.
- code_coverage_target: no numeric threshold for this tranche; scenario coverage and type coverage are more important than line coverage.
- validation_hooks:
  - package-level `pnpm --filter @typed/compiler test`;
  - focused `@typed/app` runtime tests after registry canonicalization;
  - type tests in compiler/app/fx surfaces where value/error/service inference is affected;
  - root build or package build once implementation crosses package boundaries.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| TypeScript compiler API | available | use existing package dependency and `vmc` patterns |
| `@typed/template` parser/runtime renderers | available | use as equivalence oracle |
| `RefSubject.Service` | available | preserve existing API and type tests |
| `@typed/app` HMR registry | duplicated but available | canonicalize before expanding generated HMR glue |
| Vite HMR runtime | available via official API | test generated guarded code and compatibility fallback |
| virtual artifact store | available as architecture constraint | integrate only when materializing compiler output |

## Acceptance Failure Policy

- If a `TS-*` scenario fails, stop the current task and loop back to the smallest failing requirement/spec section.
- If TS analyzer facts disagree with runtime behavior, trust compiler/type-checker evidence and add diagnostics rather than preserving state unsafely.
- If route closure captures cannot lower to Effect `Context` or stable services, reject them until the user approves a new capture model.
- If duplicate runtime registry surfaces cannot be safely collapsed in the first implementation slice, forward one surface to the other and document the residual API risk.
