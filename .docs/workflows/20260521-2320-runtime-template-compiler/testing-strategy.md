# Testing Strategy - Runtime Template Compiler

Status: draft, pending human approval.

## Test Type Taxonomy

- unit:
  - Compiler IR construction and normalization.
  - Server emitter output.
  - DOM emitter output.
  - `RefSubject.Service` registry behavior.
  - HMR compatibility/fingerprint checks.
- integration:
  - `@typed/compiler` with `@typed/template` parser/runtime fallback.
  - `@typed/app` runtime functions consuming compiled outputs.
  - Vite HMR fixtures with `import.meta.hot.data`.
  - `vmc` / virtual-module compilation fixture for generated output type safety.
- e2e:
  - Runnable app fixture with route component, dependency module, optimized templates, DOM hydration, server render, and stateful HMR.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Compiler produces deterministic IR for static, dynamic, sparse, event, ref, and nested `html` templates. | FR-4, NFR-1, NFR-4 | AC-3 | yes |
| TS-2 | Server emitter output matches existing runtime HTML semantics for all supported template forms. | FR-5, FR-7, FR-20, NFR-11 | AC-3, AC-4 | yes |
| TS-3 | DOM emitter output matches existing runtime DOM/hydration semantics for all supported template forms. | FR-6, FR-7, FR-20, NFR-7, NFR-11 | AC-3, AC-4 | yes |
| TS-4 | Unsupported compiler shapes fall back to `RenderTemplate` with structured diagnostics. | FR-9 | AC-5 | yes |
| TS-5 | `@typed/app` mount/hydrate/server runtime functions accept compiled and fallback templates with preserved types. | FR-1, FR-10, FR-20 | AC-1 | yes |
| TS-6 | `@typed/compiler` package exists as focused compiler surface and does not replace `vmc`. | FR-3, FR-16, FR-17 | AC-2 | yes |
| TS-7 | Compile-time tests prove `Effect` and `Fx` success/error/service typing is preserved. | FR-7, FR-8, NFR-11 | AC-4 | yes |
| TS-8 | Eligible inline `RefSubject.make(...)` in a route component is replaced with `RefSubject.Service` and restored after HMR. | FR-11, FR-12, FR-23, FR-24, FR-25, FR-26 | AC-6 | yes |
| TS-9 | Dependency-module state participating in a route component is preserved after HMR when compatible. | FR-32, FR-33, FR-34, FR-35 | AC-6 | yes |
| TS-10 | Explicit dependency opt-out prevents HMR state preservation. | FR-36, NFR-6 | AC-6 | yes |
| TS-11 | Incompatible state shape/version or dependency fingerprint initializes fresh state or invalidates HMR. | FR-13, FR-14, FR-33, NFR-6, NFR-13 | AC-6 | yes |
| TS-12 | Dispose/prune cleanup releases render resources, listeners, and registry entries. | FR-15, NFR-7 | AC-7 | yes |
| TS-13 | Artifact-store integration materializes or intentionally bypasses compiled outputs with documented fingerprint behavior. | FR-18, NFR-1, NFR-2, NFR-10 | AC-8 | yes |
| TS-14 | `@typed/vite-plugin` preserves first-party app virtual-module registration order. | FR-19, NFR-10 | AC-9 | yes |
| TS-15 | E2E fixture proves server render plus DOM hydration for the same compiler/runtime contract. | FR-21, FR-22 | AC-10 | yes |
| TS-16 | Closure-to-context fixture rewrites an eligible component closure and rejects an unsupported closure. | FR-27, FR-28, FR-29, NFR-14 | AC-12 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking `TS-*` scenarios must pass before finalization.
- code_coverage_target: no global percentage target for the first tranche; coverage is scenario-driven because compiler/runtime behavior is the release boundary.
- validation_hooks:
  - `pnpm --filter @typed/compiler test`
  - `pnpm --filter @typed/compiler build`
  - `pnpm --filter @typed/app test`
  - `pnpm --filter @typed/app build`
  - `pnpm --filter @typed/fx test`
  - `pnpm --filter @typed/fx build`
  - `pnpm --filter @typed/virtual-modules-compiler test`
  - targeted Vite HMR fixture command once the fixture exists
  - final root `pnpm build` when package-level gates are green

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| `@typed/template` parser/runtime semantics | ready | Use current tests as equivalence oracle. |
| `Fx.fn` | ready | Already exists in `packages/fx/src/Fx/constructors/fn.ts`. |
| `RefSubject.Service` | missing | Specify and implement before service-backed HMR tasks. |
| `@typed/compiler` package | missing | Scaffold in planning/execution after spec approval. |
| Vite HMR fixture | missing | Create integration fixture with `import.meta.hot.data` lifecycle hooks. |
| virtual artifact store | ready | Integrate only where compiled output materialization is required. |
| closure-to-context transform | missing | Implement after service-backed HMR proof. |

## Acceptance Failure Policy

- If any blocking `TS-*` scenario fails during execution, loop back within that task: keep the failing test, fix the implementation, and rerun the scenario.
- If a dependency is marked missing, the plan must schedule it before dependent scenarios.
- If compiler output and runtime output disagree, runtime equivalence is the immediate blocker; do not weaken tests to fit generated output.
- If type preservation fails, the generated/API type contract must be fixed before runtime behavior work continues.
- If HMR compatibility cannot be proven, state must initialize fresh or HMR must invalidate; preserving stale state is a release blocker.
