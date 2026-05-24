# Cohesion Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` after explicit human approval if subagents are available; otherwise use `superpowers:executing-plans` task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire compiled-template resumability and DevTools through the app/browser runtime, align UI package instructions, and end with a fully functional, RealWorld-spec-compliant, 100% resumable RealWorld example while coordinating developer-tooling-owned work with the other active agent.

**Architecture:** `@typed/template` remains the compiled DOM runtime contract. `@typed/app` becomes the integration boundary that composes route resume, action resume, and devtools observers before calling compiled `renderInto`. `@typed/storybook` continues to consume app virtual modules and RealWorld runtime defaults rather than owning a second framework path.

**Tech Stack:** TypeScript, Effect, `@typed/template`, `@typed/app`, `@typed/compiler`, `@typed/devtools-runtime`, `@typed/devtools-chrome`, `@typed/storybook`, Vitest, Vite/Storybook build gates.

---

## Coordination Guardrail

Another agent is still working through `.docs/workflows/20260522-2104-serializable-template-tooling/`. Do not edit tooling-owned surfaces until handoff:

- `packages/virtual-modules-*`
- `packages/vite-plugin` unless required only to consume an app runtime API
- `packages/compiler` CLI, diagnostics, host extension, TS plugin, or VS Code integration
- null-byte virtual id handling

Allowed compiler work in this plan is limited to compiled-template action-resume bootstrapping in `packages/compiler/src/template/transformTemplateModule.ts` and RealWorld resumability proof. If RealWorld compliance requires null-byte virtual-id fixes, browser externalization fixes, Vite host changes, TS plugin changes, or VS Code changes, stop and get developer-tooling handoff before editing those surfaces.

## Exact Definitions

`100% functional RealWorld` means these commands complete with exit code 0 in this checkout:

```bash
pnpm --filter typed-realworld check
pnpm --filter typed-realworld build
pnpm --filter typed-realworld test
pnpm --filter typed-realworld storybook:build
pnpm --filter typed-realworld test:acceptance:local
pnpm --filter typed-realworld test:hmr:local
```

`100% compliant RealWorld` means `pnpm --filter typed-realworld test:acceptance:local` passes after running the upstream Hurl API specs and upstream Playwright browser E2E specs through the existing RealWorld local runner. If `hurl` or the Playwright Chromium browser is unavailable, the status is `blocked`, not compliant.

`100% resumable` means all of the following are true:

- `packages/compiler/src/resumability/coverageMatrix.test.ts` reports every route/template/event/UI row as `resumable` or intentionally `static-safe`.
- `packages/compiler/src/route/classifyRouteCaptures.test.ts`, `packages/compiler/src/route/transformRouteModule.test.ts`, and `packages/compiler/src/template/transformTemplateModule.test.ts` pass.
- `examples/realworld/src/tests/presentation/resumability.test.ts` proves route resume and action resume through server-rendered DOM plus generated browser hydration.
- No RealWorld route or UI event path remains on `EventHandler.make(...)` or an equivalent non-action event handler when it needs to survive server render to browser hydration.
- Any unsupported case fails closed with a compiler diagnostic; it is not silently treated as resumable.

## Execution Rules

- This document is the execution contract, not the source of truth for final completion. If another agent lands commits while this plan is open, the executor must reconcile the commit with the task, rerun that task's verification command, and only then mark the checkbox complete.
- Do not mark a checkbox complete until the command in that step has been run and its output inspected in the execution turn.
- Do not skip the red step. If a test unexpectedly passes before implementation, update the test so it proves the missing behavior before editing production code.
- Do not edit tooling-owned files unless `developer-tooling-handoff.md` says ownership has been handed off or the human explicitly approves that edit.
- A warning is acceptable only when the plan records why it has no RealWorld compliance or resumability impact. A warning with unknown impact is a blocker.
- If a command fails for missing local prerequisites, record it as `blocked` with the exact missing command or binary. Do not claim the gate passed.

## Subgoal DAG

```mermaid
flowchart TD
  T0["T0 Coordination checkpoint"] --> T1["T1 UI package instructions"]
  T0 --> T2["T2 App DOM runtime helper"]
  T2 --> T3["T3 Mount passes runtime to compiled templates"]
  T2 --> T4["T4 Browser VM hydrates with runtime helper"]
  T3 --> T5["T5 Compiler boots action resume"]
  T4 --> T6["T6 DevTools browser bridge"]
  T5 --> T7["T7 RealWorld resumability proof"]
  T6 --> T7
  T7 --> T8["T8 RealWorld compliance gates"]
  T8 --> T9["T9 Final verification and handoff notes"]
```

## File Structure

- Create: `packages/app/src/runtime/domTemplateRuntime.ts` - compose route/action resume and optional devtools DOM observer.
- Create: `packages/app/src/runtime/domTemplateRuntime.test.ts` - runtime helper unit tests.
- Modify: `packages/app/src/runtime/RuntimeTemplate.ts` - add `runtime` to `MountOptions`.
- Modify: `packages/app/src/runtime/mount.ts` - pass runtime into compiled `renderInto`.
- Modify: `packages/app/src/runtime/index.ts` - export the helper.
- Modify: `packages/app/src/internal/emitBrowserSource.ts` - emit browser hydration through the helper.
- Modify: `packages/app/src/BrowserVirtualModulePlugin.test.ts` - snapshot generated runtime source.
- Modify: `packages/compiler/src/template/transformTemplateModule.ts` - import/emit `bootActionResume` when a compiled template has action descriptors.
- Modify: `packages/compiler/src/template/transformTemplateModule.test.ts` - prove action resume is emitted.
- Create: `packages/app/src/runtime/devtoolsBridge.ts` - install the browser global expected by Chrome DevTools.
- Create: `packages/app/src/runtime/devtoolsBridge.test.ts` - prove enabled and disabled bridge behavior.
- Create: `examples/realworld/src/tests/presentation/resumability.test.ts` - prove RealWorld route/action resumability through generated hydration.
- Create: `examples/realworld/src/tests/presentation/storybook-runtime.test.ts` - prove RealWorld stories keep consuming generated Storybook runtime defaults.
- Modify: `examples/realworld/src/routes/**` only when `resumability.test.ts` or acceptance gates expose a specific non-resumable or non-compliant route.
- Modify: `examples/realworld/src/**/*.ts` only when a named RealWorld gate fails and the fix is app-owned.
- Modify: `packages/ui/AGENTS.md` - align package instructions with README.
- Create: `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md` - track active developer-tooling ownership.
- Create: `.docs/workflows/20260524-1047-cohesion-remediation-plan/memories.md` - capture execution lessons.
- Modify: this workflow's `plan.md` during execution.

## Tasks

### Task 0: Coordination Checkpoint

**Files:**
- Modify: `.docs/workflows/20260524-1047-cohesion-remediation-plan/plan.md`
- Create: `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md`

- [ ] **Step 1: Capture current worktree and tooling workflow status**

Run:

```bash
git status -sb
sed -n '1,260p' .docs/workflows/20260522-2104-serializable-template-tooling/plan.md
```

Expected: worktree changes are either this workflow's docs or explicitly identified external-agent changes.

- [ ] **Step 2: Write the handoff note**

Create `developer-tooling-handoff.md`:

```markdown
# Developer Tooling Handoff

- status: another agent is still working through `.docs/workflows/20260522-2104-serializable-template-tooling/`
- blocked_surfaces:
  - virtual-module host/plugin/VS Code/TS plugin diagnostics
  - compiler CLI and vmc extension hooks
  - null-byte virtual id cleanup
- allowed_overlap:
  - app runtime helper consumed by generated browser source
  - compiled-template action-resume bootstrapping only
- required_before_tooling_edits: explicit handoff from the developer-tooling agent or human approval
```

- [ ] **Step 3: Commit**

Commit message:

```text
docs: record cohesion remediation coordination
```

### Task 1: Align `@typed/ui` Package Instructions

**Files:**
- Modify: `packages/ui/AGENTS.md`

- [ ] **Step 1: Update instructions**

Replace the Link/SSR-only intent with this package-local contract:

```markdown
`@typed/ui` is the web integration and headless component layer for `@typed/router` and `@typed/template`. It owns Link, SSR wiring, RefSubject-backed state primitives, Schema-backed `data-*` state, StartupRef hydration, Collection/Composite substrate, and native Dialog/Popover-first layered widgets.
```

- [ ] **Step 2: Verify no stale wording remains**

Run:

```bash
rg -n "web integration layer|Link components that avoid full page reloads|SSR wiring" packages/ui/AGENTS.md
```

Expected: no Link/SSR-only framing remains; Link and SSR can still appear as capabilities.

- [ ] **Step 3: Run package docs-adjacent gate**

Run:

```bash
pnpm --filter @typed/ui test
```

Expected: pass.

- [x] **Step 4: Commit**

Commit message:

```text
docs(ui): align package instructions with headless primitives
```

### Task 2: Add App DOM Runtime Helper

**Files:**
- Create: `packages/app/src/runtime/domTemplateRuntime.ts`
- Create: `packages/app/src/runtime/domTemplateRuntime.test.ts`
- Modify: `packages/app/src/runtime/index.ts`

- [ ] **Step 1: Write failing tests**

Test that the helper includes route resume, action resume, and devtools observer when enabled:

```ts
import { makeDomBindingId } from "@typed/devtools-protocol";
import { makeDomRegistry } from "@typed/devtools-runtime";
import { describe, expect, it } from "vitest";
import {
  createAppDomTemplateRuntime,
  createActionResumeRegistry,
  createRouteResumeRegistry,
} from "../index.js";

describe("createAppDomTemplateRuntime", () => {
  it("composes route resume, action resume, and devtools observer", () => {
    const domRegistry = makeDomRegistry();
    const runtime = createAppDomTemplateRuntime({
      routeRegistry: createRouteResumeRegistry(),
      actionRegistry: createActionResumeRegistry(),
      devtools: { enabled: true, domRegistry },
    });

    expect(runtime.resumeRoute).toEqual(expect.any(Function));
    expect(runtime.resumeAction).toEqual(expect.any(Function));
    expect(runtime.devtools).toBe(domRegistry.observer);
  });

  it("omits devtools observer when disabled", () => {
    const runtime = createAppDomTemplateRuntime({
      routeRegistry: createRouteResumeRegistry(),
      actionRegistry: createActionResumeRegistry(),
      devtools: { enabled: false },
    });

    expect(runtime.devtools).toBeUndefined();
  });
});
```

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/domTemplateRuntime.test.ts
```

Expected: fail because `createAppDomTemplateRuntime` is missing.

- [ ] **Step 2: Implement helper**

Implement a narrow helper that returns `Omit<DomTemplateRuntime, "scope">`:

```ts
import type { DomTemplateRuntime } from "@typed/template/compiler-runtime/renderable";
import type { DomRegistry } from "@typed/devtools-runtime";
import {
  createActionResumeRuntime,
  createRouteResumeRuntime,
  getDefaultActionResumeRegistry,
  getDefaultRouteResumeRegistry,
  type ActionResumeRegistry,
  type RouteResumeRegistry,
} from "../resumability.js";

export interface AppDomTemplateRuntimeOptions {
  readonly actionRegistry?: ActionResumeRegistry;
  readonly routeRegistry?: RouteResumeRegistry;
  readonly devtools?: false | { readonly enabled: false } | {
    readonly enabled: true;
    readonly domRegistry: DomRegistry;
  };
}

export function createAppDomTemplateRuntime(
  options: AppDomTemplateRuntimeOptions = {},
): Omit<DomTemplateRuntime, "scope"> {
  const route = createRouteResumeRuntime(options.routeRegistry ?? getDefaultRouteResumeRegistry());
  const action = createActionResumeRuntime(options.actionRegistry ?? getDefaultActionResumeRegistry());
  const devtools =
    options.devtools && options.devtools.enabled ? options.devtools.domRegistry.observer : undefined;
  return {
    resumeRoute: route.resumeRoute,
    resumeAction: action.resumeAction,
    ...(devtools && { devtools }),
  };
}
```

- [ ] **Step 3: Export helper**

Add to `packages/app/src/runtime/index.ts`:

```ts
export * from "./domTemplateRuntime.js";
```

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/domTemplateRuntime.test.ts
pnpm --filter @typed/app build
```

Expected: pass.

- [x] **Step 5: Commit**

Commit message:

```text
feat(app): compose dom template runtime
```

### Task 3: Pass Runtime Through Compiled Mounts

**Files:**
- Modify: `packages/app/src/runtime/RuntimeTemplate.ts`
- Modify: `packages/app/src/runtime/mount.ts`
- Create: `packages/app/src/runtime/mount.test.ts`

- [ ] **Step 1: Write failing mount test**

Add a compiled-template test where `renderInto` receives the runtime object:

```ts
import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { mount } from "./mount.js";

describe("mount compiled templates", () => {
  it("passes the DOM runtime to compiled renderInto", async () => {
    const root = document.createElement("main");
    const runtime = { resumeAction: () => Effect.void };
    const calls: unknown[] = [];
    const template = {
      renderInto: async (_root: HTMLElement, _values?: ArrayLike<unknown>, received?: unknown) => {
        calls.push(received);
        root.replaceChildren(document.createTextNode("ok"));
        return Array.from(root.childNodes);
      },
    };

    await Effect.runPromise(mount(template, { root, runtime }));

    expect(calls).toEqual([runtime]);
  });
});
```

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/mount.test.ts
```

Expected: fail because `MountOptions` has no `runtime` and `mountCompiled` does not pass it.

- [ ] **Step 2: Add runtime option**

In `RuntimeTemplate.ts`, add:

```ts
import type { DomTemplateRuntime } from "@typed/template/compiler-runtime/renderable";

export interface MountOptions<Values extends ReadonlyArray<Renderable.Any> = readonly Renderable.Any[]> {
  readonly root: HTMLElement;
  readonly values?: Values;
  readonly runtime?: Omit<DomTemplateRuntime, "scope">;
}
```

- [ ] **Step 3: Pass runtime to compiled render**

In `mountCompiled`:

```ts
const nodes = await template.renderInto(
  options.root,
  options.values ?? emptyValues(),
  options.runtime,
);
```

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/mount.test.ts
pnpm --filter @typed/app test
```

Expected: pass.

- [ ] **Step 5: Commit**

Commit message:

```text
feat(app): pass dom runtime through compiled mounts
```

### Task 4: Hydrate Browser Virtual Modules With The App DOM Runtime

**Files:**
- Modify: `packages/app/src/internal/emitBrowserSource.ts`
- Modify: `packages/app/src/BrowserVirtualModulePlugin.test.ts`
- Modify: `packages/compiler/src/template/emitDomTemplate.ts` for the shared compiled-template type signature consumed by `@typed/app`.

- [ ] **Step 1: Update generated-source snapshot expectation first**

Expected generated source should import and use the helper:

```ts
import {
  composeWithLayers,
  createAppDomTemplateRuntime,
  mount as mountRuntime,
  type ComputeLayers,
  type LayerOrGroup,
} from "@typed/app/runtime";
```

and:

```ts
function makeRenderLayer(win: Window, root: HTMLElement) {
  const domRuntime = createAppDomTemplateRuntime();
  return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
    Layer.provideMerge(TypedRouter.BrowserRouter(win)),
  );
}
```

Run:

```bash
pnpm --filter @typed/app exec vitest run src/BrowserVirtualModulePlugin.test.ts
```

Expected: fail snapshot mismatch before implementation.

- [ ] **Step 2: Implement emitted source change**

Update the generated import and `makeRenderLayer` body in `emitBrowserSource.ts` to match the snapshot.

- [ ] **Step 3: Verify generated source typechecks**

Run:

```bash
pnpm --filter @typed/app exec vitest run src/BrowserVirtualModulePlugin.test.ts
pnpm --filter @typed/app build
```

Expected: pass.

- [x] **Step 4: Commit**

Commit message:

```text
feat(app): hydrate browser templates with dom runtime
```

### Task 5: Boot Action Resume In Compiled Templates

**Files:**
- Modify: `packages/compiler/src/template/transformTemplateModule.ts`
- Modify: `packages/compiler/src/template/transformTemplateModule.test.ts`

- [x] **Step 1: Write failing compiler snapshot**

Add or update a transform test with an action descriptor. Expected generated DOM runtime imports include:

```ts
import {
  bindAttr,
  bindBoolean,
  bindClass,
  bindData,
  bindEvent,
  bindNode,
  bindProperty,
  bindRef,
  bindText,
  bootActionResume,
  bootRouteResume,
  defineDomTemplate,
  getCommentAtPath,
  getElementAtPath,
  getNodeAtPath,
  mountDomTemplateBindings
} from "@typed/template/compiler-runtime/dom";
```

Expected mount includes:

```ts
Effect.all([
  bindEvent(getElementAtPath(instance.root, [0]), "click", values[0], {
    "component": "component-id",
    "event": "click",
    "id": "action-id"
  }),
  bootActionResume(instance.root, runtime)
], { concurrency: "unbounded" })
```

Run:

```bash
pnpm --filter @typed/compiler exec vitest run src/template/transformTemplateModule.test.ts
```

Expected: fail because `bootActionResume` is not emitted.

- [x] **Step 2: Implement action-resume detection**

Add a helper that checks whether any template event part resolves to an action descriptor:

```ts
function hasActionResumeDescriptor(
  template: TemplateModuleTemplate,
  descriptors: ReadonlyMap<string, object>,
): boolean {
  return template.plan.parts.some(
    (part) =>
      part.kind === "event" &&
      actionDescriptorForValue(template, part.valueIndex, descriptors) !== undefined,
  );
}
```

Use it to include `bootActionResume` in imports and mount effects for direct and table-driven declarations.

- [x] **Step 3: Verify compiler/template gates**

Run:

```bash
pnpm --filter @typed/compiler exec vitest run src/template/transformTemplateModule.test.ts
pnpm --filter @typed/template test
pnpm --filter @typed/compiler build
```

Expected: pass.

- [ ] **Step 4: Commit**

Commit message:

```text
feat(compiler): boot action resume for compiled templates
```

### Task 6: Install The Browser DevTools Bridge

**Files:**
- Create: `packages/app/src/runtime/devtoolsBridge.ts`
- Create: `packages/app/src/runtime/devtoolsBridge.test.ts`
- Modify: `packages/app/src/runtime/domTemplateRuntime.ts`
- Modify: `packages/app/src/runtime/index.ts`
- Modify: `packages/app/src/internal/emitBrowserSource.ts`
- Modify: `packages/app/src/BrowserVirtualModulePlugin.test.ts`

- [x] **Step 1: Write failing bridge tests**

Test enabled and disabled behavior:

```ts
import { makeDomRegistry } from "@typed/devtools-runtime";
import { describe, expect, it } from "vitest";
import { installTypedDevtoolsBridge } from "./devtoolsBridge.js";

describe("installTypedDevtoolsBridge", () => {
  it("installs selected element resolution when enabled", () => {
    const element = document.createElement("button");
    const registry = makeDomRegistry();
    const globalObject: Record<string, unknown> = {};

    registry.observer.onTemplateMounted?.({
      nodes: [element],
      root: document.createElement("main"),
      templateHash: "template",
    });

    installTypedDevtoolsBridge({ enabled: true, domRegistry: registry, globalObject });

    const api = globalObject.__TYPED_DEVTOOLS__ as {
      resolveSelectedElement: (node: Node) => unknown;
    };
    expect(api.resolveSelectedElement(element)).toMatchObject({ _tag: "Resolved" });
  });

  it("does not install the bridge when disabled", () => {
    const globalObject: Record<string, unknown> = {};
    installTypedDevtoolsBridge({ enabled: false, globalObject });
    expect(globalObject.__TYPED_DEVTOOLS__).toBeUndefined();
  });
});
```

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/devtoolsBridge.test.ts
```

Expected: fail because the bridge installer is missing.

- [x] **Step 2: Implement bridge installer**

Implement the smallest global contract Chrome already expects:

```ts
import type { DomRegistry } from "@typed/devtools-runtime";

export interface TypedDevtoolsBridgeOptions {
  readonly enabled: boolean;
  readonly domRegistry?: DomRegistry;
  readonly globalObject?: Record<PropertyKey, unknown>;
}

export function installTypedDevtoolsBridge(options: TypedDevtoolsBridgeOptions): void {
  const globalObject = options.globalObject ?? (globalThis as Record<PropertyKey, unknown>);
  if (!options.enabled || !options.domRegistry) {
    delete globalObject.__TYPED_DEVTOOLS__;
    return;
  }
  globalObject.__TYPED_DEVTOOLS__ = {
    resolveSelectedElement: (node: Node) => options.domRegistry!.resolveNode(node),
  };
}
```

- [x] **Step 3: Emit bridge installation from typed:browser**

Update `emitBrowserSource.ts` so generated `typed:browser` source imports `makeDomRegistry` from `@typed/devtools-runtime` and imports `installTypedDevtoolsBridge` from `@typed/app/runtime`.

Extend the generated `BrowserOptions` with:

```ts
readonly devtools?: boolean;
```

Change generated `makeRenderLayer` to:

```ts
function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<BrowserLayerInputs>) {
  const domRegistry = options.devtools === true ? makeDomRegistry() : undefined;
  installTypedDevtoolsBridge({
    enabled: options.devtools === true,
    ...(domRegistry ? { domRegistry } : {}),
    globalObject: win as unknown as Record<PropertyKey, unknown>,
  });
  const domRuntime = createAppDomTemplateRuntime(
    domRegistry
      ? { devtools: { enabled: true, domRegistry } }
      : { devtools: { enabled: false } },
  );
  return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
    Layer.provideMerge(TypedRouter.BrowserRouter(win)),
  );
}
```

Update `hydrateFromOptions` to call:

```ts
const renderLayer = makeRenderLayer(win, root, options);
```

- [x] **Step 4: Verify app and Chrome transport tests**

Run:

```bash
pnpm --filter @typed/app exec vitest run src/runtime/devtoolsBridge.test.ts src/runtime/domTemplateRuntime.test.ts
pnpm --filter @typed/devtools-chrome test
pnpm --filter @typed/devtools-runtime test
```

Expected: pass.

- [ ] **Step 5: Commit**

Commit message:

```text
feat(app): install typed devtools browser bridge
```

### Task 7: Prove RealWorld Resumability Through The Generated Runtime

**Files:**
- Create: `examples/realworld/src/tests/presentation/resumability.test.ts`
- Modify: `examples/realworld/src/tests/hmr/ui-hmr.spec.ts`
- Modify: `examples/realworld/src/routes/__hmr-ui.ts`
- Modify RealWorld route/UI files named by failing diagnostics from this task.
- Do not add broad Storybook features.

- [x] **Step 1: Add a failing RealWorld resumability test**

Create `examples/realworld/src/tests/presentation/resumability.test.ts` with two tests:

1. a static SSR assertion for a RealWorld page containing route resume and action-resume metadata;
2. a generated browser source assertion proving `typed:browser?routes=./routes` emits `createAppDomTemplateRuntime`, `installTypedDevtoolsBridge`, and `mountRuntime(Routes, { root, runtime: domRuntime })`.

The test must assert:

```ts
expect(serverHtml).toContain("data-typed-resume");
expect(serverHtml).toContain("data-typed-route-resume-id");
expect(serverHtml).toContain("data-typed-action-");
expect(generatedBrowserSource).toContain("createAppDomTemplateRuntime");
expect(generatedBrowserSource).toContain("installTypedDevtoolsBridge");
expect(generatedBrowserSource).toContain("runtime: domRuntime");
```

Extend `examples/realworld/src/tests/hmr/ui-hmr.spec.ts` so the browser HMR route also proves client-side state survives generated hydration and action wiring:

```ts
await page.getByRole("button", { name: "Toggle disclosure" }).click();
await expect(page.getByText("Disclosure state survived")).toBeVisible();
await page.getByRole("button", { name: "Open select" }).click();
await page.getByRole("option", { name: "Personal" }).click();
await expect(page.getByTestId("hmr-select-value")).toHaveText("personal");
```

Run:

```bash
pnpm --filter typed-realworld exec vitest run src/tests/presentation/resumability.test.ts
```

Expected: fail before the browser runtime handoff and action boot fixes are complete.

- [x] **Step 2: Fix RealWorld non-resumable paths reported by the tests**

For each failing route or component path printed by `resumability.test.ts`, `ui-hmr.spec.ts`, or compiler diagnostics:

- replace non-resumable event handlers with `EventHandler.action(...)`
- keep serializable route resume values explicit
- preserve existing user-facing behavior
- add a diagnostic assertion in `packages/compiler/src/route/classifyRouteCaptures.test.ts` when the compiler must reject a non-resumable path

- [x] **Step 3: Verify compiler resumability coverage**

Run:

```bash
pnpm --filter @typed/compiler exec vitest run src/resumability/coverageMatrix.test.ts src/route/classifyRouteCaptures.test.ts src/route/transformRouteModule.test.ts src/template/transformTemplateModule.test.ts
pnpm --filter typed-realworld exec vitest run src/tests/presentation/resumability.test.ts
```

Expected: all pass, with no known non-resumable RealWorld route/action path.

- [ ] **Step 4: Commit**

Commit message:

```text
test(realworld): prove generated runtime resumability
```

### Task 8: Prove RealWorld Functional Compliance

**Files:**
- Modify `examples/realworld` files named by a failing command in this task.
- Update `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md` if compliance depends on tooling-owned fixes.

- [ ] **Step 1: Run the local RealWorld app gates**

Run:

```bash
pnpm --filter typed-realworld check
pnpm --filter typed-realworld build
pnpm --filter typed-realworld test
pnpm --filter typed-realworld storybook:build
```

Expected: pass without hiding warnings that affect runtime correctness.

- [ ] **Step 2: Ensure local acceptance prerequisites are present**

Run:

```bash
command -v hurl
pnpm --filter typed-realworld exec playwright install chromium
```

Expected: Hurl is installed and Chromium is available for Playwright. If Hurl is absent, write the blocker to `developer-tooling-handoff.md` and stop this task with status `blocked`; do not continue to Step 3.

- [ ] **Step 3: Run upstream local acceptance**

Run:

```bash
pnpm --filter typed-realworld test:acceptance:local
```

Expected: pass. This resets/seeds the local database, starts the full app server, runs upstream Hurl API acceptance, runs upstream Playwright browser E2E acceptance, and tears the server down.

- [ ] **Step 4: Run local HMR/resumability gate**

Run:

```bash
pnpm --filter typed-realworld test:hmr:local
```

Expected: pass.

- [ ] **Step 5: Resolve or hand off tooling-owned blockers**

When these gates expose browser externalization, null-byte virtual-id, Vite host, TS plugin, or VS Code integration defects, append this exact record to `developer-tooling-handoff.md`:

```markdown
- blocker:
- owner: developer-tooling workflow or cohesion remediation
- handoff status:
- failing command:
- exact error:
- required next action:
```

Do not finalize until every blocker record has either `owner: cohesion remediation` and a fixing commit, or `owner: developer-tooling workflow` and an explicit handoff/resolution note.

- [ ] **Step 6: Commit**

Commit message:

```text
test(realworld): verify functional compliance
```

### Task 9: Add Storybook/RealWorld Runtime Smoke

**Files:**
- Create: `examples/realworld/src/tests/presentation/storybook-runtime.test.ts`
- Do not add broad Storybook features.

- [ ] **Step 1: Add a smoke that exercises generated runtime defaults**

Create `examples/realworld/src/tests/presentation/storybook-runtime.test.ts`. It should read `examples/realworld/src/Home.stories.ts` and `examples/realworld/src/Shell.stories.ts`, then assert both consume the generated runtime defaults:

```ts
expect(homeStorySource).toContain('from "typed:storybook/runtime?path=/"');
expect(shellStorySource).toContain('from "typed:storybook/runtime?path=/"');
expect(homeStorySource).not.toContain("routes=./src/routes");
expect(shellStorySource).not.toContain("routes=./src/routes");
```

Also build the generated Storybook runtime source with `createStorybookVirtualModulePlugin` and assert:

```ts
expect(generatedRuntimeSource).toContain('import Routes from "typed:router?dir=./src/routes";');
expect(generatedRuntimeSource).toContain('apiBaseUrl');
expect(generatedRuntimeSource).toContain('makeStoryRuntime');
```

- [ ] **Step 2: Run Storybook gates**

Run:

```bash
pnpm --filter @typed/storybook test
pnpm --filter @typed/storybook build
pnpm --filter typed-realworld storybook:build
```

Expected: pass. Browser-externalization warnings are allowed only when Task 8 recorded that they have no RealWorld compliance or resumability impact.

- [ ] **Step 3: Commit**

Commit message:

```text
test(storybook): smoke generated typed runtime
```

### Task 10: Final Verification And Handoff Notes

**Files:**
- Modify: `.docs/workflows/20260524-1047-cohesion-remediation-plan/plan.md`
- Create: `.docs/workflows/20260524-1047-cohesion-remediation-plan/memories.md`
- Modify: `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md`

- [ ] **Step 1: Run focused gates**

Run:

```bash
pnpm --filter @typed/ui test
pnpm --filter @typed/app test
pnpm --filter @typed/compiler test
pnpm --filter @typed/template test
pnpm --filter @typed/devtools-runtime test
pnpm --filter @typed/devtools-chrome test
pnpm --filter @typed/storybook test
pnpm --filter typed-realworld check
pnpm --filter typed-realworld build
pnpm --filter typed-realworld test
pnpm --filter typed-realworld storybook:build
pnpm --filter typed-realworld test:acceptance:local
pnpm --filter typed-realworld test:hmr:local
```

Expected: pass.

- [ ] **Step 2: Run final gates**

Run:

```bash
pnpm build
git diff --check
git status -sb
```

Expected: build and diff check pass; status contains only intended branch changes.

- [ ] **Step 3: Record residual developer-tooling items**

If no handoff happened, record the following as external-agent or follow-up items:

```markdown
- null-byte virtual id warning: resolved, or owned by developer-tooling workflow with no RealWorld compliance impact
- browser externalization warnings: resolved, or owned by developer-tooling workflow with no RealWorld compliance impact
- Vite/TS plugin/VS Code diagnostics: untouched
```

- [ ] **Step 4: Commit**

Commit message:

```text
chore: finalize cohesion remediation plan
```

## Approval Gate

Do not execute Task 0 or later implementation tasks until the human explicitly approves this plan and confirms whether the developer-tooling agent owns the null-byte and browser-externalization warnings. Regardless of ownership, finalization cannot claim a 100% functional/compliant RealWorld example or 100% resumability until the RealWorld acceptance and resumability gates pass.
