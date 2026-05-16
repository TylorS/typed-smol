# Router and HttpApi Implementation Hardening Implementation Plan

Status: approved.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `@typed/app` Router and HttpApi virtual-module implementations with generated-source type-check proof, installed Effect HttpApi compatibility, OpenAPI correctness, and fail-clear participating-contract diagnostics.

**Architecture:** Add a reusable generated-source fixture harness in `packages/app` tests, then use it to drive narrow red-green implementation slices. Keep Router descriptor validation/rendering, HttpApi convention parsing, Effect HttpApi render helpers, and OpenAPI mapping as separate boundaries so API drift and convention behavior remain local and testable.

**Tech Stack:** TypeScript, Vitest, TypeScript compiler API, `@typed/virtual-modules` TypeInfoApi, `@typed/router`, `effect@4.0.0-beta.66`.

---

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Add reusable generated-source type-check harness in `packages/app` tests. | approved requirements/spec | high | FR-6, FR-11, NFR-6, AC-4, AC-8 | Harness can compile a generated `.ts` module with fixture source files and report diagnostics. |
| SG-2 | Prove and harden Router generated-source correctness. | SG-1 | medium | FR-2, FR-7, NFR-1, NFR-2, AC-1, AC-5 | Router generated source type-checks for entrypoint and concern fixtures; user-reachable invalid concern paths return diagnostics. |
| SG-3 | Prove current HttpApi generated-source failures against installed Effect declarations. | SG-1 | high | FR-3, FR-4, FR-6, NFR-5, AC-2, AC-4 | A failing fixture captures current generated-source mismatch before implementation changes. |
| SG-4 | Introduce Effect HttpApi render helper boundary and fix baseline HttpApi source type-checking. | SG-3 | high | FR-3, FR-8, NFR-5, AC-2, AC-6 | Baseline HttpApi generated source compiles against `effect@4.0.0-beta.66`. |
| SG-5 | Harden HttpApi convention parity and non-participating file behavior. | SG-4 | medium | FR-5, FR-7, FR-9, NFR-2, NFR-3, AC-3, AC-5 | Supported conventions are emitted/diagnosed/deferred; unrelated reserved-looking files do not warn or fail. |
| SG-6 | Implement OpenAPI annotations/exposure correctness. | SG-4, SG-5 | high | FR-8, FR-10, NFR-5, AC-6, AC-7 | JSON, Swagger, Scalar inline/CDN, and supported annotations emit installed APIs and type-check. |
| SG-7 | Sync durable docs and run final verification. | SG-2, SG-6 | medium | FR-4, NFR-6, AC-1 through AC-8 | Durable specs no longer conflict with approved decisions; `@typed/app` build/test pass. |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | direct or test-strategist | approved plan | targeted Vitest for harness | add helper only; no plugin behavior changes | delete helper/tests if harness direction fails |
| T2 | direct or execution-operator | T1 | Router generated-source tests | tests first; preserve current snapshots unless proof says stale | revert Router changes only |
| T3 | direct or execution-operator | T1 | failing HttpApi generated-source fixture | failing test must fail for generated-source reason | remove failing fixture if harness invalid |
| T4 | direct or execution-operator | T3 | HttpApi generated-source fixture passes | emit only installed Effect APIs | revert new helper boundary and emitter edits |
| T5 | direct or execution-operator | T4 | convention parity tests | do not treat unrelated files as diagnostics | revert role-classifier/descriptor edits |
| T6 | direct or execution-operator | T4, T5 | OpenAPI generated-source tests | no guessed/stale Effect options | revert OpenAPI extraction/emission edits |
| T7 | docs-archivist or direct | T2, T6 | docs diff review + package gates | update canonical docs only for approved conflicts | revert docs-only changes |
| T8 | release-finalizer or direct | T7 | `pnpm --filter @typed/app build` and `test` | inspect dirty state before final commit | leave branch unmerged if verification fails |

## File Structure

- Create `packages/app/src/test-utils/generatedSourceHarness.ts`
  - Shared TypeScript compiler harness for emitted virtual module source.
- Modify `packages/app/src/RouterVirtualModulePlugin.test.ts`
  - Add generated-source type-check scenarios for Router.
- Modify `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
  - Add generated-source type-check scenarios for HttpApi.
- Modify `packages/app/src/internal/emitHttpApiSource.ts`
  - Route installed Effect HttpApi call rendering through focused helpers.
- Create `packages/app/src/internal/emitHttpApiEffect.ts` if helper extraction keeps `emitHttpApiSource.ts` smaller and clearer.
- Modify `packages/app/src/internal/httpapiFileRoles.ts`
  - Make reserved-looking unmatched files non-participating instead of diagnostic roles.
- Modify `packages/app/src/internal/httpapiDescriptorTree.ts`
  - Drop warning flow for non-participating roles; retain diagnostics for real supported-convention conflicts.
- Modify `packages/app/src/internal/httpapiOpenApiConfig.ts`
  - Normalize installed-supported OpenAPI annotation/exposure config and stale-key diagnostics.
- Modify `packages/app/src/internal/extractHttpApiOpenApi.ts`
  - Extract scalar source/version/config and supported annotations as needed.
- Modify `.docs/specs/httpapi-virtual-module-plugin/spec.md`, `requirements.md`, and `testing-strategy.md`
  - Align durable docs with approved installed-Effect source-of-truth and non-participating file behavior.
- Modify `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/memories.md` or create workflow memory notes if execution finds durable learnings.

## Task Details

### Task 1: Generated Source Type-Check Harness

Status: completed.

Detailed execution notes:
- Keep the helper behavior-only: write generated source into an existing fixture root, add it to the program root files, and return flattened diagnostics.
- Use one fixture root for both plugin build and generated-source type-checking so relative generated imports resolve to the files that produced the source.
- Add the first Router smoke as a red test for the missing helper before creating `packages/app/src/test-utils/generatedSourceHarness.ts`.

**Files:**
- Create: `packages/app/src/test-utils/generatedSourceHarness.ts`
- Modify: `packages/app/src/RouterVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [x] **Step 1: Write the failing harness smoke test**

Add a minimal test in `RouterVirtualModulePlugin.test.ts` that calls a new helper:

```ts
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";

it("type-checks a generated Router virtual module source fixture", () => {
  const fixture = createFixture({
    "src/routes/home.ts": route("/", "export const handler = 1;"),
  });
  const source = buildRouterFromFixture({
    "src/routes/home.ts": route("/", "export const handler = 1;"),
  });
  expect(typeof source).toBe("string");
  const result = typeCheckGeneratedSource({
    rootDir: fixture.root,
    generatedPath: "src/router.generated.ts",
    sourceText: source as string,
    rootFiles: fixture.paths,
  });
  expect(result.diagnostics).toEqual([]);
});
```

- [x] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @typed/app test -- src/RouterVirtualModulePlugin.test.ts -t "type-checks a generated Router virtual module source fixture"
```

Expected: fail because `typeCheckGeneratedSource` does not exist.

- [x] **Step 3: Implement the helper**

Create `packages/app/src/test-utils/generatedSourceHarness.ts` with:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "typescript";

export type GeneratedSourceTypeCheckInput = {
  readonly rootDir: string;
  readonly generatedPath: string;
  readonly sourceText: string;
  readonly rootFiles: readonly string[];
  readonly moduleFallbacks?: Readonly<Record<string, string>>;
};

export type GeneratedSourceTypeCheckResult = {
  readonly diagnostics: readonly string[];
};

export function typeCheckGeneratedSource(
  input: GeneratedSourceTypeCheckInput,
): GeneratedSourceTypeCheckResult {
  const generatedAbs = join(input.rootDir, input.generatedPath);
  mkdirSync(dirname(generatedAbs), { recursive: true });
  writeFileSync(generatedAbs, input.sourceText, "utf8");

  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    allowJs: true,
  };
  const defaultHost = ts.createCompilerHost(options);
  const fallbackEntries = input.moduleFallbacks ?? {};
  const moduleResolutionHost: ts.ModuleResolutionHost = {
    getCurrentDirectory: () => input.rootDir,
    fileExists: defaultHost.fileExists.bind(defaultHost),
    readFile: defaultHost.readFile.bind(defaultHost),
    useCaseSensitiveFileNames: () => defaultHost.useCaseSensitiveFileNames(),
  };
  const host: ts.CompilerHost = {
    ...defaultHost,
    getCurrentDirectory: () => input.rootDir,
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) => {
        const resolved = ts.resolveModuleName(
          moduleName,
          containingFile,
          options,
          moduleResolutionHost,
        );
        if (resolved.resolvedModule) return resolved.resolvedModule;
        const fallback = fallbackEntries[moduleName];
        if (fallback && defaultHost.fileExists(fallback)) {
          return {
            resolvedFileName: fallback,
            extension: fallback.endsWith(".ts") ? ts.Extension.Ts : ts.Extension.Js,
            isExternalLibraryImport: false,
          };
        }
        return undefined;
      }),
  };
  const program = ts.createProgram([...input.rootFiles, generatedAbs], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
  return { diagnostics };
}
```

- [x] **Step 4: Run the harness smoke test**

Run the same command. Expected: pass, or fail with real generated-source diagnostics that become Task 2 input.

- [x] **Step 5: Commit**

```bash
git add packages/app/src/test-utils/generatedSourceHarness.ts packages/app/src/RouterVirtualModulePlugin.test.ts
git commit -m "test(app): add generated source typecheck harness" -m "- add reusable TypeScript fixture compiler for emitted virtual modules" -m "- add Router smoke coverage for generated source compilation"
```

### Task 2: Router Generated-Source Hardening

Status: completed.

Detailed execution notes:
- Reuse the Task 1 generated-source harness through focused Router test helpers.
- First hardening fixtures cover handler-kind emission and participating concern composition.
- Preserve existing snapshot assertions; add type-check proof alongside them rather than replacing snapshots.

**Files:**
- Modify: `packages/app/src/RouterVirtualModulePlugin.test.ts`
- Modify if needed: `packages/app/src/internal/routerDescriptorTree.ts`
- Modify if needed: `packages/app/src/internal/buildRouteDescriptors.ts`

- [x] **Step 1: Add generated-source Router fixtures**

Add tests for:

- mixed entrypoints: plain, `Effect`, `Stream`, `Fx`;
- nested directory and sibling `layout`, `dependencies`, `catch`, `guard`;
- invalid participating concern metadata returns `VirtualModuleBuildError`.

- [x] **Step 2: Run tests and capture failures**

Run:

```bash
pnpm --filter @typed/app test -- src/RouterVirtualModulePlugin.test.ts
```

Expected: new tests reveal any generated-source or diagnostic gaps.

- [x] **Step 3: Patch smallest Router boundary**

If failures are renderer invariant throws, move validation into `buildRouteDescriptors` or return structured diagnostics before `emitRouterMatchSource`.

- [x] **Step 4: Verify Router**

Run:

```bash
pnpm --filter @typed/app test -- src/RouterVirtualModulePlugin.test.ts
```

Expected: pass.

- [x] **Step 5: Commit**

```bash
git add packages/app/src/RouterVirtualModulePlugin.test.ts packages/app/src/internal/routerDescriptorTree.ts packages/app/src/internal/buildRouteDescriptors.ts
git commit -m "fix(app): harden router generated source" -m "- add generated-source typecheck coverage for Router virtual modules" -m "- convert reachable invalid Router metadata into structured diagnostics"
```

### Task 3: HttpApi Baseline Generated-Source Failure

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [ ] **Step 1: Add failing HttpApi generated-source fixture**

Use `typeCheckGeneratedSource` with `VALID_ENDPOINT_SOURCE` and the existing `HTTPAPI_MODULE_FALLBACKS`.

Expected assertion:

```ts
expect(result.diagnostics).toEqual([]);
```

- [ ] **Step 2: Run the failing test**

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "type-checks generated HttpApi source"
```

Expected: fail if current generated source is stale against installed Effect or helper imports.

- [ ] **Step 3: Record failure in workflow memory**

Create or update `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/memory/generated-source-failures.md` with the exact diagnostic summary.

- [ ] **Step 4: Commit failing test only if the project workflow allows red commits**

If committing a red test is not acceptable, keep this as an uncommitted red phase and proceed to Task 4 in the same working set.

### Task 4: HttpApi Effect Adapter Boundary and Baseline Type-Check

**Files:**
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`
- Create if helpful: `packages/app/src/internal/emitHttpApiEffect.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [ ] **Step 1: Extract render helpers**

Create helpers for installed APIs:

```ts
export const renderHttpApiLayer = (apiName: string, openapiPath?: string): string =>
  openapiPath
    ? `HttpApiBuilder.layer(${apiName}, { openapiPath: ${JSON.stringify(openapiPath)} })`
    : `HttpApiBuilder.layer(${apiName})`;

export const renderScalarLayer = (apiName: string, scalar: ScalarRenderConfig | undefined): string => {
  if (!scalar) return `HttpApiScalar.layer(${apiName})`;
  const options = renderObjectLiteral({
    path: scalar.path,
    scalar: scalar.configExpression,
    version: scalar.version,
  });
  return scalar.source === "cdn"
    ? `HttpApiScalar.layerCdn(${apiName}, ${options})`
    : `HttpApiScalar.layer(${apiName}, ${options})`;
};
```

- [ ] **Step 2: Wire baseline emitter through helpers**

Keep emitted source equivalent for non-OpenAPI baseline except where type-check failures require installed-API corrections.

- [ ] **Step 3: Run the baseline HttpApi generated-source test**

Expected: pass.

- [ ] **Step 4: Run full HttpApi tests**

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts
```

Expected: pass with updated snapshots if source output changed.

- [ ] **Step 5: Commit**

```bash
git add packages/app/src/internal/emitHttpApiSource.ts packages/app/src/internal/emitHttpApiEffect.ts packages/app/src/HttpApiVirtualModulePlugin.test.ts
git commit -m "fix(app): typecheck httpapi generated source" -m "- add generated-source fixture proof for HttpApi virtual modules" -m "- isolate installed Effect HttpApi render calls behind helpers"
```

### Task 5: HttpApi Convention Parity and Non-Participation

**Files:**
- Modify: `packages/app/src/internal/httpapiFileRoles.ts`
- Modify: `packages/app/src/internal/httpapiDescriptorTree.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [ ] **Step 1: Add red tests for non-participating files**

Test that `src/apis/users/_unknown.ts` does not produce warnings/errors and does not affect source.

- [ ] **Step 2: Add red tests for supported convention collisions**

Examples:

- duplicate `_api.ts` equivalent from normalized paths if representable;
- endpoint primary and endpoint companion collision where supported convention semantics are ambiguous.

- [ ] **Step 3: Change role classifier**

Represent unmatched reserved-looking files as ignored/non-participating, or filter them before descriptor diagnostics.

- [ ] **Step 4: Preserve diagnostics for real collisions**

Keep or add structured `AVM-*` diagnostics only for supported participating conventions that conflict.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/internal/httpapiFileRoles.ts packages/app/src/internal/httpapiDescriptorTree.ts packages/app/src/HttpApiVirtualModulePlugin.test.ts
git commit -m "fix(app): ignore non participating httpapi files" -m "- stop warning on reserved-looking files outside supported conventions" -m "- keep structured diagnostics for participating convention conflicts"
```

### Task 6: OpenAPI Annotations and Exposure

**Files:**
- Modify: `packages/app/src/internal/httpapiOpenApiConfig.ts`
- Modify: `packages/app/src/internal/extractHttpApiOpenApi.ts`
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [ ] **Step 1: Add red tests for exposure**

Fixtures:

- JSON path emits `HttpApiBuilder.layer(Api, { openapiPath })`;
- Swagger path emits `HttpApiSwagger.layer(Api, { path })`;
- Scalar inline emits `HttpApiScalar.layer(Api, { path, scalar })`;
- Scalar CDN emits `HttpApiScalar.layerCdn(Api, { path, scalar, version })`.

- [ ] **Step 2: Add red tests for annotations**

Fixtures:

- `_api.ts` annotations emit `Api.annotateMerge(OpenApiModule.annotations(...))`;
- `_group.ts` annotations emit group annotation source;
- endpoint `.openapi.ts` or in-file `openapi` emits endpoint annotation source where supported.

- [ ] **Step 3: Add red test for stale `additionalProperties`**

Expected: diagnostic or documented deferral, never emitted `OpenApi.fromApi(Api, ...)`.

- [ ] **Step 4: Implement extraction and rendering**

Update extraction to carry:

- annotation object;
- exposure `{ jsonPath, swaggerPath, scalar: { path, source, version, config } }`;
- unsupported generation config diagnostics.

- [ ] **Step 5: Verify generated source type-checks**

Run targeted OpenAPI tests, then full HttpApi test file.

- [ ] **Step 6: Commit**

```bash
git add packages/app/src/internal/httpapiOpenApiConfig.ts packages/app/src/internal/extractHttpApiOpenApi.ts packages/app/src/internal/emitHttpApiSource.ts packages/app/src/HttpApiVirtualModulePlugin.test.ts
git commit -m "fix(app): harden httpapi openapi generation" -m "- emit installed Effect OpenAPI annotations and exposure APIs" -m "- reject stale unsupported OpenAPI generation config"
```

### Task 7: Durable Spec Sync and Memory

**Files:**
- Modify: `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- Modify: `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
- Modify: `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
- Create/modify: `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/memory/*.md`

- [ ] **Step 1: Update stale Effect version/source-of-truth language**

Replace stale `effect@4.0.0-beta.4` source references with local installed declaration source-of-truth language from the accepted ADR.

- [ ] **Step 2: Defer unsupported `additionalProperties`**

Remove it from must-have generated behavior or mark as deferred pending installed Effect support.

- [ ] **Step 3: Update reserved-looking file behavior**

Document non-participation unless colliding with supported conventions.

- [ ] **Step 4: Update testing strategy**

Add generated-source type-check fixtures as blocking critical-path tests.

- [ ] **Step 5: Capture memory candidates**

Record:

- installed Effect declarations are source of truth for emitted HttpApi source;
- generated-source type-check fixtures are stronger than snapshots;
- reserved-looking non-conventions are non-participating files.

- [ ] **Step 6: Commit**

```bash
git add .docs/specs/httpapi-virtual-module-plugin .docs/workflows/20260516-0957-router-httpapi-implementation-hardening/memory
git commit -m "docs(app): sync httpapi hardening specs" -m "- align durable HttpApi docs with installed Effect source-of-truth" -m "- document generated-source proof and non-participating file behavior"
```

### Task 8: Final Verification and PR Prep

**Files:**
- Modify: `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/99-finalization.md`

- [ ] **Step 1: Run package verification**

```bash
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Expected: both pass.

- [ ] **Step 2: Run broader verification if touched shared modules**

If files outside `packages/app` changed:

```bash
pnpm build
pnpm test
```

Expected: pass or documented environment-only blocker.

- [ ] **Step 3: Write finalization artifact**

Create `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/99-finalization.md` with:

- changes made;
- TS scenario evidence;
- commands run;
- known deferrals.

- [ ] **Step 4: Commit finalization if needed**

```bash
git add .docs/workflows/20260516-0957-router-httpapi-implementation-hardening/99-finalization.md
git commit -m "docs(app): finalize router httpapi hardening workflow" -m "- record verification evidence and remaining deferrals"
```

- [ ] **Step 5: Push and create PR**

Use the GitHub finalization flow after checking `git status --short --branch`.

## Tactical Replanning Triggers

- Generated source fails to type-check because the fixture harness is wrong: fix the harness before changing plugin behavior.
- Generated source fails because installed Effect declarations differ from docs: follow the accepted ADR and change emitter/spec, not casts.
- A task touches more than two implementation boundaries: split the task and re-approve the affected plan slice if scope changes.
- A durable spec conflict appears outside HttpApi/Router virtual modules: document it as a deferral unless it blocks generated-source correctness.
- Full `pnpm build` fails outside touched scope: isolate whether the failure is pre-existing before broadening the plan.

## Memory Plan

- capture:
  - generated-source diagnostics that drove implementation changes;
  - Effect API drift examples;
  - reusable fixture harness patterns;
  - convention parity decisions.
- promotion_criteria:
  - promote only findings likely to affect future `@typed/app` Router/HttpApi work;
  - include source paths and verification commands;
  - do not promote transient test failures once fixed unless they reveal a recurring heuristic.
- recall_targets:
  - prior typed-smol framework evolution memory;
  - current workflow `02-research.md`;
  - accepted ADR `20260516-1318-httpapi-generated-source-effect-source-of-truth.md`.

## Self-Review

- Spec coverage:
  - FR-1 through FR-11 are covered by SG-1 through SG-7 and TS-1 through TS-10.
  - AC-1 through AC-8 are covered by TS-1 through TS-10.
- Placeholder scan:
  - No TBD/TODO placeholders remain.
- Type consistency:
  - Helper names introduced in Task 1 are used consistently in later tasks.
  - Effect render helper names are illustrative implementation targets and can be adjusted during execution if a smaller local helper is clearer.
