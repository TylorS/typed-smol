# Runtime Compiler Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `@typed/compiler` around a shared template/resumability substrate and enable route-module CPS continuations for resumable HMR through Effect `Context` and `RefSubject.Service`.

**Architecture:** Build one TypeScript-backed route analysis path, then lower route closures and state identities into continuation descriptors consumed by HMR/runtime planning. Keep all `html` template optimization on the same shared compiler path and collapse duplicated runtime registry surfaces before expanding generated HMR glue.

**Tech Stack:** TypeScript compiler API, Vitest, `@typed/compiler`, `@typed/app`, `@typed/fx`, `@typed/template`, Effect `Context`, `RefSubject.Service`, Vite HMR.

---

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Add TypeScript-backed route module analysis facts | approved spec | high | FR-4, FR-11, FR-12, FR-13, NFR-3, AC-2 | analyzer detects services/templates/closures without regex-only scanning |
| SG-2 | Lower route closures into CPS continuation descriptors | SG-1 | high | FR-5-FR-10, FR-21, AC-3, AC-7 | closure fixtures produce continuation descriptors or diagnostics |
| SG-3 | Unify recursive dependency/resumability descriptors | SG-1, SG-2 | high | FR-13-FR-18, FR-15a, AC-4, AC-4a, AC-5 | capability and CPS planners consume recursive dependency descriptors |
| SG-4 | Canonicalize `@typed/app` HMR/resume registry | SG-3 | medium | FR-19, NFR-1, AC-6 | duplicate registry imports resolve to one implementation and tests pass |
| SG-5 | Keep template optimization on shared model | SG-1 | medium | FR-1, FR-22-FR-25, AC-1 | server/DOM equivalence fixtures still pass |
| SG-6 | Verify virtual-module/artifact-store boundaries | SG-1-SG-5 | low | FR-26-FR-29, AC-8, AC-9, AC-10 | package tests pass and unsupported paths produce structured reasons |

## File Structure

- Create `packages/compiler/src/route/analyzeRouteModule.ts`: TypeScript AST/type-checker-backed route facts.
- Create `packages/compiler/src/route/RouteModulePlan.ts`: shared route facts, closure facts, capture facts, diagnostics.
- Create `packages/compiler/src/route/analyzeRouteModule.test.ts`: route analysis fixtures.
- Modify `packages/compiler/src/hmr/analyzeComponentHmr.ts`: route HMR analysis becomes an adapter over route facts rather than regex source truth.
- Modify `packages/compiler/src/hmr/dependencies.ts`: dependency participation uses shared service descriptors and recursive graph traversal.
- Create or modify `packages/compiler/src/hmr/dependencyGraph.ts`: recursive dependency traversal, stable ordering, cycle detection, opt-out boundary handling.
- Modify `packages/compiler/src/hmr/closureContext.ts`: closure context planning becomes capture lowering support for route CPS.
- Modify `packages/compiler/src/cps/planCpsCompilation.ts`: continuation descriptors include closure continuations and context/service captures.
- Modify `packages/compiler/src/capabilities/compileCapabilities.ts`: capability planning consumes shared route/resumability facts.
- Modify `packages/compiler/src/index.ts`: export new route/resumability modules.
- Modify `packages/app/src/runtime/hmrRegistry.ts`: canonical registry adds optional generated symbol/context identity fields if needed.
- Modify `packages/app/src/runtimeTemplates/hmrRegistry.ts`: forward to canonical runtime registry or delete after public imports are updated.
- Modify `packages/app/src/runtimeTemplateCompilerExample.ts`: update example to use new route analysis/CPS descriptors.
- Modify tests near each changed module; add type tests where generated context/service typing is exposed.

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | direct | approved plan | `pnpm --filter @typed/compiler test -- analyzeRouteModule` | add tests before implementation; keep old HMR API intact | remove new route module files |
| T2 | direct | T1 | `pnpm --filter @typed/compiler test -- analyzeComponentHmr dependencies` | adapter over new facts; do not delete old behavior until equivalent tests pass | restore previous HMR analyzer implementation |
| T3 | direct | T1 | `pnpm --filter @typed/compiler test -- closureContext planCpsCompilation` | reject unsupported captures; no heap preservation | revert CPS descriptor extensions |
| T4 | direct | T2, T3 | `pnpm --filter @typed/compiler test -- dependencies compileCapabilities viteHmr` | recursive traversal must be deterministic; cycles and opt-outs covered before capability changes | restore direct-dependency planner |
| T5 | direct | T4 | `pnpm --filter @typed/app test -- hmrRegistry runtimeTemplateCompilerExample` | keep public import compatibility by forwarding duplicate path first | restore duplicate registry file |
| T6 | direct | T1-T5 | `pnpm --filter @typed/compiler test -- template && pnpm --filter @typed/app test -- runtimeTemplateCompilerExample` | use runtime renderers as equivalence oracle | revert template emitter changes if behavior drifts |
| T7 | direct | T1-T6 | `pnpm --filter @typed/compiler test && pnpm --filter @typed/app test -- runtimeTemplateCompilerExample` | update docs/memories only after tests prove behavior | revert docs/memory additions |

## Detailed Tasks

### Task 1: TypeScript Route Analyzer Foundation

**Files:**
- Create: `packages/compiler/src/route/RouteModulePlan.ts`
- Create: `packages/compiler/src/route/analyzeRouteModule.ts`
- Create: `packages/compiler/src/route/analyzeRouteModule.test.ts`
- Modify: `packages/compiler/src/index.ts`

- [x] **Step 1: Write failing route analyzer tests**

Add tests that prove the analyzer detects route closures, `html` templates, `RefSubject.Service`, inline `RefSubject.make`, and Effect services from AST/type-checker facts.

Run: `pnpm --filter @typed/compiler test -- analyzeRouteModule`

Expected: FAIL because `analyzeRouteModule` is not exported.

- [x] **Step 2: Define route fact types**

Create `RouteModulePlan.ts` with discriminated unions for:

- `RouteModulePlan`
- `RouteClosureFact`
- `RouteCaptureFact`
- `RouteTemplateFact`
- `RouteServiceFact`
- `RouteDiagnostic`

Include diagnostic codes:

- `unsupported-mutable-capture`
- `anonymous-refsubject-state`
- `unsupported-dynamic-service-id`
- `unsupported-closure-capture`

- [x] **Step 3: Implement minimal AST analyzer**

Implement `analyzeRouteModule({ moduleId, sourceText, compilerOptions? })`.

Use `typescript` APIs:

- `ts.createSourceFile` for syntax-only tests;
- `ts.forEachChild` traversal;
- node guards for call expressions, tagged templates, variable declarations, function-like nodes;
- no regex as source of truth.

The first implementation may classify identifiers syntactically, but must preserve an upgrade path for type checker data.

- [x] **Step 4: Export the route analyzer**

Update `packages/compiler/src/index.ts` to export:

- `./route/RouteModulePlan.js`
- `./route/analyzeRouteModule.js`

- [x] **Step 5: Verify**

Run: `pnpm --filter @typed/compiler test -- analyzeRouteModule`

Expected: PASS.

- [x] **Step 6: Commit**

Commit message:

```text
feat(compiler): add route module analyzer foundation
```

### Task 2: HMR Analyzer Adapter Over Route Facts

**Files:**
- Modify: `packages/compiler/src/hmr/analyzeComponentHmr.ts`
- Modify: `packages/compiler/src/hmr/analyzeComponentHmr.test.ts`
- Modify: `packages/compiler/src/hmr/dependencies.ts`
- Modify: `packages/compiler/src/hmr/dependencies.test.ts`

- [x] **Step 1: Write failing tests for regex-free HMR detection**

Add tests that include formatting and nested calls that would be brittle for the current regexes, such as:

```ts
const Count =
  RefSubject
    .Service<number>()
    ("@app/routes/counter/Count");
```

Run: `pnpm --filter @typed/compiler test -- analyzeComponentHmr dependencies`

Expected: FAIL under current regex detection.

- [x] **Step 2: Adapt `analyzeComponentHmr`**

Make `analyzeComponentHmr` call `analyzeRouteModule` for `route-component` and `dependency` boundaries. Preserve its public result shape for existing callers.

- [x] **Step 3: Adapt dependency participation**

Make `analyzeDependencyHmr` consume shared service facts and anonymous state diagnostics from route analysis.

- [x] **Step 4: Verify compatibility**

Run:

```bash
pnpm --filter @typed/compiler test -- analyzeComponentHmr dependencies compileCapabilities
```

Expected: PASS.

- [x] **Step 5: Commit**

Commit message:

```text
refactor(compiler): derive hmr facts from route analysis
```

### Task 3: Route Closure CPS Continuation Descriptors

**Files:**
- Modify: `packages/compiler/src/hmr/closureContext.ts`
- Modify: `packages/compiler/src/hmr/closureContext.test.ts`
- Modify: `packages/compiler/src/cps/planCpsCompilation.ts`
- Modify: `packages/compiler/src/cps/planCpsCompilation.test.ts`
- Modify: `packages/compiler/src/route/RouteModulePlan.ts`
- Modify: `packages/compiler/src/route/analyzeRouteModule.ts`
- Modify: `packages/compiler/src/route/analyzeRouteModule.test.ts`

- [x] **Step 1: Write failing CPS tests**

Add tests proving:

- a route closure with `RefSubject.Service` capture lowers to a `route-closure` continuation;
- a route closure with Effect service capture lowers to a context capture record;
- mutable captures produce `unsupported-closure-capture`.

Run: `pnpm --filter @typed/compiler test -- closureContext planCpsCompilation analyzeRouteModule`

Expected: FAIL because `route-closure` continuations do not exist.

- [x] **Step 2: Extend capture facts**

Add capture kinds:

- `context-capture`
- `refsubject-service`
- `effect-service`
- `template-value`
- `unsupported`

- [x] **Step 3: Extend CPS continuation types**

Add `RouteClosureContinuation` with:

- `id`
- `kind: "route-closure"`
- `moduleId`
- `symbolId`
- `closureName`
- `captures`
- `serviceIds`
- `templateHashes`
- `compatibilityFingerprint`
- `version`

- [x] **Step 4: Lower route facts into continuations**

Update `planCpsCompilation` to accept optional route facts or add a companion `planRouteCpsCompilation` if the existing API would become muddy. Prefer the smaller API after reading call sites.

- [x] **Step 5: Verify**

Run:

```bash
pnpm --filter @typed/compiler test -- closureContext planCpsCompilation analyzeRouteModule
```

Expected: PASS.

- [x] **Step 6: Commit**

Commit message:

```text
feat(compiler): lower route closures into continuations
```

### Task 4: Unified Capability And Vite HMR Planning

**Files:**
- Create or Modify: `packages/compiler/src/hmr/dependencyGraph.ts`
- Create or Modify: `packages/compiler/src/hmr/dependencyGraph.test.ts`
- Modify: `packages/compiler/src/capabilities/compileCapabilities.ts`
- Modify: `packages/compiler/src/capabilities/compileCapabilities.test.ts`
- Modify: `packages/compiler/src/hmr/viteHmr.ts`
- Modify: `packages/compiler/src/hmr/viteHmrFixture.test.ts`

- [x] **Step 1: Write failing recursive dependency tests**

Add tests proving:

- route module dependencies are traversed recursively;
- transitive `RefSubject.Service` identities appear in route descriptors;
- cycles terminate with deterministic visited order;
- explicit opt-out stops traversal below that module;
- anonymous state in a transitive dependency is rejected with the dependency module id.

Run: `pnpm --filter @typed/compiler test -- dependencyGraph dependencies`

Expected: FAIL because recursive dependency graph traversal does not exist.

- [x] **Step 2: Implement recursive dependency graph traversal**

Implement or extend dependency analysis with:

- stable sorted module traversal;
- `visited` set by module id;
- cycle metadata;
- opt-out boundary recording;
- recursive participant/rejection aggregation.

- [x] **Step 3: Write failing compatibility tests**

Add tests proving compatibility fingerprints include:

- module identity;
- generated symbol identity;
- service identity;
- capture/context fingerprint;
- dependency fingerprints;
- compiler/runtime version.

Run: `pnpm --filter @typed/compiler test -- compileCapabilities viteHmr`

Expected: FAIL because generated symbol/context fingerprints are not included.

- [x] **Step 4: Update capability planning**

Make capability planning include route resumability descriptors alongside template and HMR capabilities, using recursive dependency descriptors.

- [x] **Step 5: Update Vite HMR runtime emission**

Emit guarded HMR code that calls canonical runtime helpers with continuation descriptors. Keep `import.meta.hot.accept(` syntactically visible for Vite static analysis.

- [x] **Step 6: Verify**

Run:

```bash
pnpm --filter @typed/compiler test -- dependencyGraph dependencies compileCapabilities viteHmr viteHmrFixture
```

Expected: PASS.

- [x] **Step 7: Commit**

Commit message:

```text
feat(compiler): plan resumable route hmr capabilities
```

### Task 5: Canonical App Runtime Registry

**Files:**
- Modify: `packages/app/src/runtime/hmrRegistry.ts`
- Modify: `packages/app/src/runtime/hmrRegistry.test.ts`
- Modify: `packages/app/src/runtimeTemplates/hmrRegistry.ts`
- Modify: `packages/app/src/runtimeTemplates/hmrRegistry.test.ts`
- Modify: `packages/app/src/runtimeTemplateCompilerExample.ts`
- Modify: `packages/app/src/runtimeTemplateCompilerExample.test.ts`

- [x] **Step 1: Write failing public-import tests**

Add tests proving `runtime/hmrRegistry` and `runtimeTemplates/hmrRegistry` share the same registry key and behavior.

Run: `pnpm --filter @typed/app test -- hmrRegistry`

Expected: FAIL if duplicate behavior diverges or forwarding is absent.

- [x] **Step 2: Add continuation-aware descriptor fields**

Extend registry descriptor support to include optional:

- `symbolId`
- `contextFingerprint`
- `captureFingerprint`

Do not break existing descriptor callers.

- [x] **Step 3: Forward duplicate registry module**

Make `packages/app/src/runtimeTemplates/hmrRegistry.ts` re-export from `../runtime/hmrRegistry.js`.

- [x] **Step 4: Update runtime template compiler example**

Use the new analyzer/CPS descriptor path instead of string-only HMR planning.

- [x] **Step 5: Verify**

Run:

```bash
pnpm --filter @typed/app test -- hmrRegistry runtimeTemplateCompilerExample
```

Expected: PASS.

- [x] **Step 6: Commit**

Commit message:

```text
refactor(app): canonicalize hmr resume registry
```

### Task 6: Preserve Shared Template Optimization Behavior

**Files:**
- Modify only if needed:
  - `packages/compiler/src/template/TemplatePlan.ts`
  - `packages/compiler/src/template/analyzeTemplate.ts`
  - `packages/compiler/src/template/emitDomTemplate.ts`
  - `packages/compiler/src/template/emitServerTemplate.ts`
  - related template tests

- [x] **Step 1: Run existing template equivalence tests**

Run:

```bash
pnpm --filter @typed/compiler test -- template
```

Expected: PASS before template changes. If it fails, stop and classify whether the failure is from current branch drift or this plan.

- [x] **Step 2: Add missing equivalence fixture only if needed**

If previous tasks changed template facts, add focused fixtures for the changed shape. Do not broaden template work beyond what route resumability needs.

- [x] **Step 3: Keep server and DOM target behavior aligned**

If target adapters require changes, make the smallest shared-model update and prove both emitters still match runtime renderer behavior.

- [x] **Step 4: Verify**

Run:

```bash
pnpm --filter @typed/compiler test -- emitDomTemplate emitServerTemplate analyzeTemplate TemplatePlan
```

Expected: PASS.

- [x] **Step 5: Commit if files changed**

Commit message:

```text
test(compiler): preserve template optimization equivalence
```

### Task 7: Final Verification, Workflow Memory, And Merge-Ready Commit State

**Files:**
- Modify: `.docs/workflows/20260522-1908-runtime-compiler-simplification/memories.md`
- Modify: `.docs/workflows/20260522-1908-runtime-compiler-simplification/plan.md`

- [x] **Step 1: Run focused package tests**

Run:

```bash
pnpm --filter @typed/compiler test
pnpm --filter @typed/app test -- hmrRegistry runtimeTemplateCompilerExample
```

Expected: PASS.

- [x] **Step 2: Run broader build gate if package tests pass**

Run:

```bash
pnpm --filter @typed/compiler build
pnpm --filter @typed/app build
```

Expected: PASS.

- [x] **Step 3: Update workflow memory**

Record only reusable implementation lessons in:

```text
.docs/workflows/20260522-1908-runtime-compiler-simplification/memories.md
```

- [x] **Step 4: Update plan task statuses**

Mark completed task checkboxes in this plan as implementation progresses.

- [x] **Step 5: Commit final docs/status**

Commit message:

```text
docs: record runtime compiler implementation outcome
```

## Tactical Replanning Triggers

- If TypeScript AST analysis cannot reliably identify a fact syntactically, switch that fact to type-checker-backed analysis within the same task.
- If a route closure capture cannot lower into Effect `Context` or stable service identity, add a diagnostic and continue with unsupported-path coverage.
- If recursive dependency traversal finds cycles, preserve deterministic cycle metadata and continue only when descriptors are stable.
- If an explicit dependency opt-out conflicts with inferred participation, opt-out wins and traversal stops at that boundary.
- If Vite HMR static analysis does not see generated `import.meta.hot.accept(`, adjust emitted runtime shape before expanding registry behavior.
- If `@typed/app` registry canonicalization breaks public imports, forward duplicate paths rather than deleting them.
- If template equivalence tests fail after HMR/CPS changes, stop and fix the shared template model before adding new capability.

## Memory Plan

- capture:
  - route analyzer API decisions;
  - recursive dependency traversal decisions;
  - CPS descriptor fields that proved necessary;
  - Vite HMR compatibility gotchas;
  - any rejected capture shapes and diagnostics.
- promotion_criteria:
  - promote only after package tests pass and implementation proves the rule is reusable.
- recall_targets:
  - `@typed/compiler` runtime compiler constraints;
  - virtual-module-first ADR;
  - artifact-store fingerprint rules;
  - prior `RefSubject.Service` identity decisions.

## Plan Self-Review

- Spec coverage:
  - Route resumability: T1-T4.
  - `RefSubject.Service` HMR: T2-T5.
  - Effect `Context` capture lowering: T3, T7.
  - Template optimization path: T6.
  - Runtime registry cleanup: T5.
  - Virtual-module/artifact-store boundary: T4, T7.
- Placeholder scan:
  - No `TBD` or `TODO` placeholders are intentionally left.
- Type consistency:
  - `RouteModulePlan`, route facts, CPS continuation descriptors, and registry descriptor fields are introduced before downstream tasks consume them.
