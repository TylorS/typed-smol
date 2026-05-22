# Runtime Template Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task unless the human explicitly authorizes subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@typed/compiler`, optimize all `@typed/template` `html` templates for server and DOM targets, and add service-backed route/dependency HMR state preservation.

**Architecture:** `@typed/compiler` owns template/app compilation and emits typed target plans. `@typed/app` owns runtime entrypoints that consume compiled or fallback templates. `@typed/fx` provides `RefSubject.Service` identities and dev-only HMR registry integration; `vmc` remains the TypeScript host adapter.

**Tech Stack:** TypeScript, Effect, `@typed/fx`, `@typed/template`, `@typed/app`, Vitest, Vite HMR, `@typed/virtual-modules`, `@typed/virtual-modules-compiler`.

---

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Scaffold `@typed/compiler` and lock public contracts. | approved spec | medium | FR-3, FR-16, FR-17, AC-2 | `pnpm --filter @typed/compiler build` and package import tests pass. |
| SG-2 | Build complete template IR for all `html` template forms. | SG-1 | high | FR-4, FR-7, FR-20, AC-3, AC-4 | IR tests cover static, dynamic, sparse, event, ref, nested, class/data/property/boolean parts. |
| SG-3 | Emit server-optimized template output. | SG-2 | high | FR-5, FR-7, FR-20, AC-3, AC-4 | Server emitter fixtures match current `HtmlRenderTemplate` output. |
| SG-4 | Emit DOM-optimized template output. | SG-2 | high | FR-6, FR-7, FR-20, AC-3, AC-4 | DOM emitter fixtures match current `DomRenderTemplate`/hydration behavior. |
| SG-5 | Add `@typed/app` runtime functions. | SG-3, SG-4 | medium | FR-1, FR-10, AC-1 | Runtime API tests mount, hydrate, and render compiled/fallback templates. |
| SG-6 | Add `RefSubject.Service` and dev HMR registry. | SG-1 | high | FR-11 through FR-15, FR-23 through FR-26, NFR-5, NFR-6, NFR-8, NFR-13, AC-6, AC-7 | HMR registry unit tests preserve compatible state and reject incompatible state. |
| SG-7 | Compile route/dependency HMR boundaries. | SG-2, SG-6 | high | FR-30 through FR-36, AC-6 | Route/dependency fixture preserves service-backed state and honors opt-out. |
| SG-8 | Add closure-to-context rewriting. | SG-6, SG-7 | high | FR-27 through FR-29, NFR-14, AC-12 | Positive and negative closure rewrite fixtures pass. |
| SG-9 | Integrate Vite/vmc/artifact behavior and examples. | SG-3, SG-4, SG-5, SG-7 | high | FR-18, FR-19, FR-21, FR-22, NFR-1, NFR-2, NFR-10, AC-8, AC-9, AC-10 | Vite HMR fixture, vmc typecheck fixture, and server+DOM example pass. |
| SG-10 | Final hardening and traceability. | SG-1 through SG-9 | medium | NFR-9, NFR-11, NFR-12, AC-11 | Full package gates pass; `memories.md` and plan statuses are updated. |

## File Structure

Create:

- `packages/compiler/package.json` - package manifest for `@typed/compiler`.
- `packages/compiler/tsconfig.json` - build config.
- `packages/compiler/AGENTS.md` - package guidance.
- `packages/compiler/src/index.ts` - public exports.
- `packages/compiler/src/template/TemplatePlan.ts` - typed IR model.
- `packages/compiler/src/template/analyzeTemplate.ts` - template parsing/IR construction.
- `packages/compiler/src/template/emitServerTemplate.ts` - server target emitter.
- `packages/compiler/src/template/emitDomTemplate.ts` - DOM target emitter.
- `packages/compiler/src/template/fingerprints.ts` - deterministic compiler/HMR fingerprints.
- `packages/compiler/src/hmr/analyzeComponentHmr.ts` - route/component/dependency HMR eligibility.
- `packages/compiler/src/hmr/closureContext.ts` - closure context model and rewrite planning.
- `packages/compiler/src/hmr/options.ts` - opt-in/opt-out configuration types.
- `packages/compiler/src/test-utils/renderEquivalence.ts` - shared equivalence harness.
- `packages/compiler/src/**/*.test.ts` - unit and integration tests.

Modify:

- `pnpm-workspace.yaml` - ensure compiler package is included if glob does not already include it.
- `tsconfig.build.json` - add `packages/compiler`.
- `packages/fx/src/RefSubject/RefSubject.ts` - add `RefSubject.Service`.
- `packages/fx/src/RefSubject/index.ts` and `packages/fx/src/index.ts` - export service additions.
- `packages/app/src/index.ts` - export app runtime functions.
- `packages/app/src/runtime/*.ts` - runtime functions and HMR registry integration.
- `packages/app/src/internal/emitBrowserSource.ts` - consume runtime functions/HMR descriptors.
- `packages/app/src/internal/emitServerSource.ts` - consume server runtime function where appropriate.
- `packages/vite-plugin/src/index.ts` - preserve app VM plugin ordering and add compiler/HMR integration only after tests prove it.
- `.docs/workflows/20260521-2320-runtime-template-compiler/memories.md` - execution memory.

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | direct | approved plan | `pnpm --filter @typed/compiler build` | scaffold only, no runtime behavior | delete `packages/compiler` scaffold |
| T2 | direct | T1 | `pnpm --filter @typed/compiler test -- TemplatePlan` | IR-only changes | revert compiler IR files |
| T3 | direct | T2 | `pnpm --filter @typed/compiler test -- analyzeTemplate` | compare against current parser output | revert analyzer files |
| T4 | direct | T3 | `pnpm --filter @typed/compiler test -- emitServerTemplate` | use current HTML renderer as oracle | revert server emitter |
| T5 | direct | T3 | `pnpm --filter @typed/compiler test -- emitDomTemplate` | use current DOM/hydration tests as oracle | completed in `feat: emit dom optimized templates` |
| T6 | direct | T4, T5 | `pnpm --filter @typed/compiler test -- fallback` | unsupported shapes fallback only | completed in `feat: add template compiler fallback path` |
| T7 | direct | T4, T5 | `pnpm --filter @typed/app test -- runtime` | runtime accepts fallback and compiled templates | completed in `feat(app): add typed runtime template functions` |
| T8 | direct | T1 | `pnpm --filter @typed/fx test -- RefSubject` | no HMR yet; service API only | completed in `feat(fx): add refsubject service identity` |
| T9 | direct | T8 | `pnpm --filter @typed/app test -- hmrRegistry` | dev-only registry, no Vite wiring yet | completed in `feat(app): add typed hmr state registry` |
| T10 | direct | T8, T9 | `pnpm --filter @typed/compiler test -- analyzeComponentHmr` | analysis only, no source rewrite | completed in `feat(compiler): analyze component hmr state` |
| T11 | direct | T10 | `pnpm --filter @typed/compiler test -- dependencyHmr` | opt-out proves no preservation | completed in `feat(compiler): infer route hmr dependencies` |
| T12 | direct | T10, T11 | `pnpm --filter @typed/compiler test -- closureContext` | no arbitrary closure serialization | completed in `feat(compiler): plan closure hmr contexts` |
| T13 | direct | T7, T10 | `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin` | preserve VM plugin ordering | completed in `feat(app): wire browser runtime templates` |
| T14 | direct | T7 | `pnpm --filter @typed/app test -- ServerVirtualModulePlugin` | preserve config-driven build paths | revert server emitter changes |
| T15 | direct | T13, T14 | targeted Vite HMR fixture command created in task | isolated fixture | remove fixture and Vite wiring |
| T16 | direct | T4, T5, T13, T14 | `pnpm --filter @typed/virtual-modules-compiler test` | artifact-store fail-closed semantics | revert artifact integration |
| T17 | direct | T15, T16 | server+DOM example command created in task | example only after package gates | remove example changes |
| T18 | direct | T1 through T17 | package gates plus `pnpm build` | final audit before commit/PR | revert last hardening commit |

## Detailed Task Plan

### Task 1: Scaffold `@typed/compiler`

**Files:**
- Create: `packages/compiler/package.json`
- Create: `packages/compiler/tsconfig.json`
- Create: `packages/compiler/AGENTS.md`
- Create: `packages/compiler/src/index.ts`
- Modify: `tsconfig.build.json`

- [ ] **Step 1: Write failing package import/build test**

Create `packages/compiler/src/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compilerPackageName } from "./index.js";

describe("@typed/compiler package", () => {
  it("exports the package marker", () => {
    expect(compilerPackageName).toBe("@typed/compiler");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @typed/compiler test -- index`

Expected: fails because `@typed/compiler` package does not exist or has no test script.

- [ ] **Step 3: Add package scaffold**

Create `packages/compiler/package.json`:

```json
{
  "name": "@typed/compiler",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./dist/index.js"
  },
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@typed/fx": "workspace:*",
    "@typed/template": "workspace:*",
    "@typed/virtual-modules": "workspace:*",
    "effect": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

Create `packages/compiler/src/index.ts`:

```ts
export const compilerPackageName = "@typed/compiler";
```

- [ ] **Step 4: Run test and build**

Run: `pnpm --filter @typed/compiler test -- index`

Expected: pass.

Run: `pnpm --filter @typed/compiler build`

Expected: pass.

- [ ] **Step 5: Commit**

Commit message: `feat: scaffold typed compiler package`.

### Task 2: Define `TemplatePlan` IR

**Files:**
- Create: `packages/compiler/src/template/TemplatePlan.ts`
- Create: `packages/compiler/src/template/TemplatePlan.test.ts`
- Modify: `packages/compiler/src/index.ts`

- [ ] **Step 1: Write failing IR normalization tests**

Test deterministic sorting/identity for static and dynamic plans.

Run: `pnpm --filter @typed/compiler test -- TemplatePlan`

Expected: fails because `TemplatePlan` is missing.

- [ ] **Step 2: Implement minimal IR types**

Add discriminated unions for:

- text nodes
- element nodes
- self-closing elements
- text-only elements
- node parts
- attribute parts
- sparse parts
- event/ref/property/class/data/boolean parts
- nested template boundaries

- [ ] **Step 3: Export IR**

Export from `packages/compiler/src/index.ts`.

- [ ] **Step 4: Verify**

Run: `pnpm --filter @typed/compiler test -- TemplatePlan`

Expected: pass.

Run: `pnpm --filter @typed/compiler build`

Expected: pass.

- [ ] **Step 5: Commit**

Commit message: `feat: define typed template compiler ir`.

### Task 3: Analyze All `html` Template Forms Into IR

**Files:**
- Create: `packages/compiler/src/template/analyzeTemplate.ts`
- Create: `packages/compiler/src/template/analyzeTemplate.test.ts`
- Modify: `packages/compiler/src/index.ts`

- [ ] **Step 1: Write failing tests for all template forms**

Cases:

- static element/text
- dynamic node interpolation
- static and dynamic attributes
- boolean/class/data/property/properties parts
- event handler part
- ref part
- sparse text/attribute/comment
- nested `html` value
- text-only elements
- doctype/comment

Run: `pnpm --filter @typed/compiler test -- analyzeTemplate`

Expected: fails because analyzer is missing.

- [ ] **Step 2: Implement analyzer using `@typed/template` parser semantics**

Use existing `parse(templateStrings)` behavior as source of truth. Convert parsed `Template.Template` nodes/parts into `TemplatePlan`.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- analyzeTemplate`

Expected: pass.

Run: `pnpm --filter @typed/compiler build`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat: analyze typed html templates into compiler ir`.

### Task 4: Emit Server Optimized Templates

**Files:**
- Create: `packages/compiler/src/template/emitServerTemplate.ts`
- Create: `packages/compiler/src/template/emitServerTemplate.test.ts`
- Create: `packages/compiler/src/test-utils/renderEquivalence.ts`

- [ ] **Step 1: Write failing equivalence tests**

For each template form from Task 3, compare emitted server output with current `HtmlRenderTemplate` / `renderToHtmlString`.

Run: `pnpm --filter @typed/compiler test -- emitServerTemplate`

Expected: fails because server emitter is missing.

- [ ] **Step 2: Implement server emitter**

Emit static chunks, dynamic chunk readers, hydration placeholders, and HTML-safe rendering using existing encoding behavior.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- emitServerTemplate`

Expected: pass.

Run: `pnpm --filter @typed/compiler build`

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `feat: emit server optimized templates`.

### Task 5: Emit DOM Optimized Templates

**Status:** Completed on 2026-05-22.

**Focused task plan:** Use `DomRenderTemplate` as the behavior oracle, first proving the missing emitter with red tests. Implement fresh DOM construction from `TemplatePlan`, then apply dynamic parts for node holes, sparse attrs/classes, boolean/data/property/properties parts, event handlers, refs, comments, text-only elements, and multi-root template boundaries.

**Files:**
- Create: `packages/compiler/src/template/emitDomTemplate.ts`
- Create: `packages/compiler/src/template/emitDomTemplate.test.ts`

- [x] **Step 1: Write failing DOM equivalence tests**

For each template form from Task 3, compare DOM output and hydration behavior against current `DomRenderTemplate` tests.

Run: `pnpm --filter @typed/compiler test -- emitDomTemplate`

Expected: fails because DOM emitter is missing.

- [x] **Step 2: Implement DOM emitter**

Emit static fragment construction, dynamic part descriptors, hydration metadata, event/ref setup instructions, and scope cleanup hooks.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- emitDomTemplate`

Expected: pass.

Run: `pnpm --filter @typed/compiler build`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat: emit dom optimized templates`.

### Task 6: Add Fallback Compiler Path

**Status:** Completed on 2026-05-22.

**Focused task plan:** Model fallback as an explicit runtime-template handoff, not as an implicit failure. Preserve the original `TemplateStringsArray`, expose structured diagnostics with the source module and reason, and keep `Renderable`/`Effect`/`Fx` type flow by delegating to the existing `html(...)` runtime path.

**Files:**
- Create: `packages/compiler/src/template/fallback.ts`
- Create: `packages/compiler/src/template/fallback.test.ts`

- [x] **Step 1: Write failing fallback tests**

Cases:

- unsupported expression source keeps runtime `RenderTemplate`
- diagnostic includes module id and reason
- fallback preserves type handoff

Run: `pnpm --filter @typed/compiler test -- fallback`

Expected: fails because fallback path is missing.

- [x] **Step 2: Implement fallback result**

Return a structured fallback output instead of throwing for unsupported compiler shapes.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- fallback`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat: add template compiler fallback path`.

### Task 7: Add `@typed/app` Runtime Functions

**Status:** Completed on 2026-05-22.

**Focused task plan:** Add a small public runtime contract in `@typed/app` that consumes compiled DOM templates, compiled server templates, and runtime fallback templates. Keep target wrappers narrow: DOM mount/hydrate delegate compiled templates to `renderInto` and fallback templates to `DomRenderTemplate`; server render delegates compiled templates to `renderToString` and fallback templates to `HtmlRenderTemplate`.

**Files:**
- Create: `packages/app/src/runtime/RuntimeTemplate.ts`
- Create: `packages/app/src/runtime/mount.ts`
- Create: `packages/app/src/runtime/hydrate.ts`
- Create: `packages/app/src/runtime/renderServer.ts`
- Create: `packages/app/src/runtime/index.ts`
- Create: `packages/app/src/runtime/runtime.test.ts`
- Modify: `packages/app/src/index.ts`

- [x] **Step 1: Write failing runtime tests**

Tests:

- `mount` accepts compiled DOM template
- `hydrate` accepts compiled DOM template
- `renderServer` accepts compiled server template
- all three accept fallback runtime templates
- compile-time type tests preserve `Effect`/`Fx` contexts

Run: `pnpm --filter @typed/app test -- runtime`

Expected: fails because runtime functions are missing.

- [x] **Step 2: Implement runtime functions**

Implement small wrappers that delegate compiled templates to compiled execution and fallback templates to existing renderers.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/app test -- runtime`

Expected: pass.

Run: `pnpm --filter @typed/app build`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(app): add typed runtime template functions`.

### Task 8: Add `RefSubject.Service`

**Status:** Completed on 2026-05-22.

**Focused task plan:** Lock down the existing `RefSubject.Service` implementation with behavior tests before HMR wiring consumes it. Verify stable service ids, explicit `Layer` provisioning, initial/effectful initializer support, and the distinction between `Count.service` yielding the underlying `RefSubject` and `Count` sampling the current value as a ref-like `Fx`/`Effect`.

**Files:**
- Modify: `packages/fx/src/RefSubject/RefSubject.ts`
- Modify: `packages/fx/src/RefSubject/index.ts`
- Modify: `packages/fx/src/index.ts`
- Create: `packages/fx/src/RefSubject.Service.test.ts`

- [x] **Step 1: Write failing service tests**

Tests:

- creates service with stable id
- builds `Layer` that yields a `RefSubject`
- supports initial value and effectful initializer
- preserves `RefSubject` value/error/service types

Run: `pnpm --filter @typed/fx test -- RefSubject.Service`

Expected: fails because `RefSubject.Service` is missing.

- [x] **Step 2: Implement `RefSubject.Service`**

Follow existing `Fx.Service` / `Context.Service` style. Keep construction pure and layer creation explicit.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/fx test -- RefSubject.Service`

Expected: pass.

Run: `pnpm --filter @typed/fx build`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(fx): add refsubject service identity`.

### Task 9: Add Dev HMR Registry

**Status:** Completed on 2026-05-22.

**Focused task plan:** Add an app-runtime registry that can reuse service-backed state across reloads without Vite wiring yet. Store state behind a namespaced global key, mirror it into `import.meta.hot.data`-style objects when supplied, compare shape/version/dependency fingerprints before reuse, and expose explicit dispose/prune helpers for future HMR lifecycle hooks.

**Files:**
- Create: `packages/app/src/runtime/hmrRegistry.ts`
- Create: `packages/app/src/runtime/hmrRegistry.test.ts`

- [x] **Step 1: Write failing registry tests**

Tests:

- compatible service state is reused
- incompatible shape/version initializes fresh state
- dependency fingerprint change invalidates state
- dispose/prune cleanup removes entries
- production-disabled path returns fresh state

Run: `pnpm --filter @typed/app test -- hmrRegistry`

Expected: fails because registry is missing.

- [x] **Step 2: Implement registry**

Use `import.meta.hot.data` when passed and a namespaced global registry for cross-module dev reuse.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/app test -- hmrRegistry`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(app): add typed hmr state registry`.

### Task 10: Analyze Component HMR State

**Status:** Completed on 2026-05-22.

**Focused task plan:** Add a descriptor-only analyzer that separates template optimization from stateful HMR eligibility. Route/component boundaries can report inline `RefSubject.make(...)` replacements and existing `RefSubject.Service(...)` identities; plain `html` template optimization remains non-stateful.

**Files:**
- Create: `packages/compiler/src/hmr/analyzeComponentHmr.ts`
- Create: `packages/compiler/src/hmr/analyzeComponentHmr.test.ts`

- [x] **Step 1: Write failing analyzer tests**

Tests:

- route component with inline `RefSubject.make` yields service replacement descriptor
- plain optimized `html` template outside component boundary has no stateful HMR descriptor
- existing `RefSubject.Service` is recognized as stable identity

Run: `pnpm --filter @typed/compiler test -- analyzeComponentHmr`

Expected: fails because analyzer is missing.

- [x] **Step 2: Implement analyzer**

Use compiler-visible module/source metadata and explicit component boundary inputs.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- analyzeComponentHmr`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(compiler): analyze component hmr state`.

### Task 11: Analyze Participating Dependencies

**Status:** Completed on 2026-05-22.

**Focused task plan:** Add dependency participation analysis that recognizes stable `RefSubject.Service(...)` identities in imported and route-companion modules, rejects anonymous dependency refs, and records explicit opt-in/opt-out overrides for cases inference misses or overreaches.

**Files:**
- Create: `packages/compiler/src/hmr/options.ts`
- Create: `packages/compiler/src/hmr/dependencies.ts`
- Create: `packages/compiler/src/hmr/dependencies.test.ts`

- [x] **Step 1: Write failing dependency tests**

Tests:

- imported dependency with stable service identity participates
- route companion dependency participates
- anonymous dependency state is rejected
- explicit opt-out prevents preservation
- explicit opt-in marks eligible dependency when inference misses it

Run: `pnpm --filter @typed/compiler test -- dependencyHmr`

Expected: fails because dependency analyzer is missing.

- [x] **Step 2: Implement dependency analysis**

Return descriptors with module id, service ids, fingerprints, and inference/override reason.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- dependencyHmr`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(compiler): infer route hmr dependencies`.

### Task 12: Add Closure Context Rewrite Planning

**Status:** Completed on 2026-05-22.

**Focused task plan:** Add planning-only closure context descriptors. Eligible captures become generated context fields, `Fx.fn`-style error/service metadata is preserved in the descriptor, and unsupported mutable captures are rejected with diagnostics instead of attempting arbitrary closure serialization.

**Files:**
- Create: `packages/compiler/src/hmr/closureContext.ts`
- Create: `packages/compiler/src/hmr/closureContext.test.ts`

- [x] **Step 1: Write failing closure tests**

Tests:

- eligible closure captures are represented as generated context object fields
- generated context preserves `Fx.fn` error/service types
- unsupported closure is rejected with diagnostic

Run: `pnpm --filter @typed/compiler test -- closureContext`

Expected: fails because closure context planner is missing.

- [x] **Step 2: Implement planning-only transform**

Produce a context descriptor and diagnostics. Keep source rewriting minimal until later execution task proves service-backed HMR.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/compiler test -- closureContext`

Expected: pass.

- [x] **Step 4: Commit**

Commit message: `feat(compiler): plan closure hmr contexts`.

### Task 13: Wire Browser Virtual Module Runtime

**Status:** Completed on 2026-05-22.

**Focused task plan:** Simplify generated browser runtime handoff by delegating route rendering through `@typed/app` `mount`/`hydrate` runtime functions while preserving route matcher merging, companion layers, error handling, and `BrowserRouter` provisioning. Avoid direct `@typed/template` DOM renderer imports in generated browser source.

**Files:**
- Modify: `packages/app/src/internal/emitBrowserSource.ts`
- Modify: `packages/app/src/BrowserVirtualModulePlugin.test.ts`

- [x] **Step 1: Write failing generated-source test**

Assert browser generated source imports and uses `@typed/app` runtime functions and preserves route matcher semantics.

Run: `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin`

Expected: fails before emitter update.

- [x] **Step 2: Update emitter**

Use runtime functions without changing plugin ordering or route composition.

- [x] **Step 3: Verify**

Run: `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin`

Expected: pass.

Run: `pnpm --filter @typed/app build`

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `feat(app): wire browser runtime templates`.

### Task 14: Wire Server Virtual Module Runtime

**Files:**
- Modify: `packages/app/src/internal/emitServerSource.ts`
- Modify: `packages/app/src/ServerVirtualModulePlugin.test.ts`

- [ ] **Step 1: Write failing generated-source test**

Assert server generated source uses `renderServer`/runtime handoff where appropriate and continues reading build paths from `typed:config`.

Run: `pnpm --filter @typed/app test -- ServerVirtualModulePlugin`

Expected: fails before emitter update.

- [ ] **Step 2: Update emitter**

Use runtime functions while preserving config-driven output dirs and existing API/router composition.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @typed/app test -- ServerVirtualModulePlugin`

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `feat(app): wire server runtime templates`.

### Task 15: Add Vite HMR Fixture

**Files:**
- Create: `packages/compiler/src/hmr/vite-hmr-fixture.test.ts` or package-local fixture under `packages/compiler/fixtures/vite-hmr/`
- Modify: `packages/vite-plugin/src/index.ts` only if runtime integration requires plugin hook support

- [ ] **Step 1: Write failing fixture**

Fixture proves:

- route component state survives compatible update
- dependency module state survives compatible update
- opt-out prevents preservation
- incompatible fingerprint initializes fresh state or invalidates

Run: command established by fixture, for example `pnpm --filter @typed/compiler test -- vite-hmr-fixture`.

Expected: fails before Vite/HMR wiring.

- [ ] **Step 2: Implement Vite HMR runtime hookup**

Use `import.meta.hot.data`, dispose/prune hooks, and registry APIs.

- [ ] **Step 3: Verify**

Run fixture command.

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `feat(compiler): prove route hmr state fixture`.

### Task 16: Integrate Artifact Store Where Required

**Files:**
- Modify: `packages/compiler/src/template/fingerprints.ts`
- Modify: `packages/virtual-modules-vite/src/vitePlugin.ts` only if a compiler output materialization hook is needed
- Modify: `packages/virtual-modules-compiler/src/cli.integration.test.ts` only if vmc fixture coverage is needed

- [ ] **Step 1: Write failing fingerprint/materialization tests**

Tests prove generated compiler output fingerprints include source/config/plugin/compiler inputs or explicitly remain in-memory for this slice.

Run: `pnpm --filter @typed/virtual-modules-compiler test`

Expected: targeted failure if integration is missing.

- [ ] **Step 2: Implement integration or documented in-memory bypass**

Use existing artifact-store fingerprint model.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @typed/virtual-modules-compiler test`

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `feat(compiler): integrate template output fingerprints`.

### Task 17: Add Runnable Server + DOM Example

**Files:**
- Create or modify a focused fixture/example selected during execution after package surfaces exist.
- Update example package scripts if needed.

- [ ] **Step 1: Write failing example gate**

Gate proves:

- server render uses optimized template output
- DOM hydrate uses optimized template output
- route component HMR state preserves `RefSubject.Service`

Run: example command created in this task.

Expected: fails before example wiring.

- [ ] **Step 2: Implement example**

Use the smallest route/component/dependency shape that exercises all accepted requirements.

- [ ] **Step 3: Verify**

Run example command.

Expected: pass.

- [ ] **Step 4: Commit**

Commit message: `test: add runtime template compiler example`.

### Task 18: Final Hardening And Traceability

**Files:**
- Modify: `.docs/workflows/20260521-2320-runtime-template-compiler/plan.md`
- Create/modify: `.docs/workflows/20260521-2320-runtime-template-compiler/memories.md`
- Modify package docs only where new public APIs need usage notes.

- [ ] **Step 1: Run package gates**

Run:

```bash
pnpm --filter @typed/compiler test
pnpm --filter @typed/compiler build
pnpm --filter @typed/app test
pnpm --filter @typed/app build
pnpm --filter @typed/fx test
pnpm --filter @typed/fx build
pnpm --filter @typed/virtual-modules-compiler test
pnpm build
```

Expected: pass, except any unrelated pre-existing root flake must be isolated with package-level evidence.

- [ ] **Step 2: Update traceability**

Mark completed tasks and record verification evidence in `plan.md` or an execution log.

- [ ] **Step 3: Update `memories.md`**

Capture only reusable lessons with evidence and promotion candidates.

- [ ] **Step 4: Commit**

Commit message: `chore: finalize runtime template compiler tranche`.

## Tactical Replanning Triggers

- A test fails for behavior not covered by the current task: pause the task, add or update the affected task only, and preserve the broader DAG.
- Type preservation fails: stop runtime implementation and fix generated/public types first.
- Runtime output diverges from existing `@typed/template` semantics: treat existing runtime tests as the oracle unless the human approves a semantic change.
- HMR state compatibility is ambiguous: do not preserve state; add a diagnostic or invalidation path.
- Artifact-store integration requires changing core virtual-module contracts: pause and ask for approval before touching shared substrate behavior.
- Existing dirty user changes conflict with a planned file: inspect and adapt; do not revert unrelated work.

## Memory Plan

- capture:
  - service-backed HMR identity lessons
  - compiler IR equivalence pitfalls
  - artifact-store/fingerprint integration constraints
  - route/dependency HMR inference mistakes
- promotion_criteria:
  - lesson is backed by a passing test, failed-test episode, or accepted ADR
  - lesson applies beyond this workflow
  - lesson does not duplicate an existing `.docs/_meta/memory/` entry
- recall_targets:
  - `.docs/_meta/memory/virtual-artifact-store-fail-closed-cache.md`
  - `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`
  - `.docs/_meta/memory/typeinfoapi-structural-type-targets.md`
  - Memory notes for Typed framework virtual-module-first architecture

## Approval Gate

This plan is ready for human sequencing review. Execution begins only after explicit plan approval.
