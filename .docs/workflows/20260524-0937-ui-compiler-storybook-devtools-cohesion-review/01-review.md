## Review Scope

- workflow_slug: 20260524-0937-ui-compiler-storybook-devtools-cohesion-review
- reviewed_surface: UI/component library, template compiler/resumability, Storybook virtual modules, Chrome DevTools branch cohesion on `codex/typed-beta`
- mode: review
- subagent_routing: required by repo policy for review-auditor, but unavailable because the callable multi-agent tool only permits spawning when the user explicitly asks for delegation.

## Findings

### P1 - Resumability and DevTools runtime handoff is not wired through generated browser mounts

- what: the compiler/template/runtime/devtools packages now expose the expected pieces, but the app browser runtime still mounts compiled DOM templates without passing a `DomTemplateRuntime`.
- why_it_matters: route resume, action resume, and DOM binding observation can pass library-level tests while generated apps never activate those hooks during browser hydration. Chrome DevTools also expects `globalThis.__TYPED_DEVTOOLS__`, but no runtime installer currently owns that bridge.
- where: `packages/app/src/runtime/mount.ts`, `packages/app/src/internal/emitBrowserSource.ts`, `packages/compiler/src/template/transformTemplateModule.ts`, `packages/template/src/compiler-runtime/dom.ts`, `packages/devtools-chrome/src/transport/inspectedWindow.ts`
- evidence: `mountCompiled` calls `template.renderInto(options.root, options.values ?? emptyValues())` with no runtime; generated `makeRenderLayer` only provides router runtime; the compiler imports/emits `bootRouteResume` but not `bootActionResume`; `rg "__TYPED_DEVTOOLS__"` only finds the Chrome transport.
- fix_path: introduce one browser runtime integration point that constructs route/action resume runtimes plus optional devtools DOM observation, passes that runtime into compiled `renderInto`, emits/boots action resume for server-rendered action descriptors, and installs the Chrome bridge when devtools is enabled.

### Resolved - RealWorld Storybook runtime imports resolved route/api targets from the wrong directory

- what: RealWorld Storybook files imported `typed:storybook/runtime?path=/&routes=./src/routes&api=./src/api` from inside `src/`, causing nested virtual imports to resolve `src/src/routes` and `src/src/api`.
- why_it_matters: `vmc -p tsconfig.json` failed and the root `pnpm build` could not complete once RealWorld Storybook files were included in the project.
- where: `examples/realworld/src/Home.stories.ts`, `examples/realworld/src/storyLayers.ts`, `examples/realworld/vmc.config.ts`
- fix_path: use the Storybook runtime defaults configured in `vmc.config.ts` and import `typed:storybook/runtime?path=/` from the stories. Keep the stories at the `src/` root so router/api virtual modules do not need parent-directory traversal, which those plugins intentionally reject.
- evidence: initial direct VMC run failed with `target directory does not exist: .../examples/realworld/src/src/routes`; after the fix, `pnpm --filter typed-realworld exec vmc -p tsconfig.json` passed.

### Resolved - Storybook preview helper overstated a never environment

- what: `mountStoryResult` returned `Effect<MountedStory, Error, never>` while Fx story mounting still preserves an unknown environment until `runWithTypedStoryRuntime` provides or boundary-casts runtime layers.
- why_it_matters: `@typed/storybook` failed to build with `Effect<MountedStory, Error, unknown>` not assignable to `Effect<MountedStory, Error, never>`.
- where: `packages/storybook/src/preview.ts`
- fix_path: preserve the helper return environment as `unknown` and leave the environment boundary at `runWithTypedStoryRuntime`.
- evidence: `pnpm --filter @typed/storybook build` failed before the fix and passed after the signature correction.

### P2 - `@typed/ui` package instructions lag the new headless component-library scope

- what: `packages/ui/AGENTS.md` still describes `@typed/ui` only as Link plus SSR web integration, while `packages/ui/README.md` now documents the headless RefSubject/DataAttr/StartupRef/component primitive surface.
- why_it_matters: future agents routed through package-local instructions can miss the current component-library ownership model and accidentally treat the headless primitives as incidental or out of scope.
- where: `packages/ui/AGENTS.md`, `packages/ui/README.md`
- fix_path: update the local package instructions to match the README and current branch direction: headless/template-native primitives, RefSubject-backed state, Schema-backed data attrs, StartupRef hydration, and native Dialog/Popover-first layering.

## Test Gaps

- Browser-interactive Storybook behavior was validated by static Storybook build only; no Playwright interaction test was added in this pass.
- RealWorld Storybook currently emits browser-compatibility warnings for server-only infrastructure imports when bundling stories.
- Vite still logs `[virtual-modules] : options.id must not contain null bytes`; it is non-fatal here, but should be investigated separately because it points at virtual id handling during bundling.

## Verification

- fresh continuation checks:
  - `pnpm build`
  - `pnpm --filter typed-realworld storybook:build`
  - `git diff --check`
  - `git status -sb`
- `pnpm --filter @typed/compiler exec vitest run src/route/transformRouteModule.test.ts`
- `pnpm --filter @typed/storybook exec vitest run src/runtime.test.ts src/preview.test.ts`
- `pnpm --filter @typed/ui exec vitest run src/Dom.test.ts src/AriakitParity.test.ts`
- `pnpm --filter @typed/router exec vitest run src/Matcher.test.ts`
- `pnpm --filter @typed/app exec vitest run src/BrowserVirtualModulePlugin.test.ts src/RouterVirtualModulePlugin.test.ts src/ServerVirtualModulePlugin.test.ts`
- `pnpm --filter @typed/template exec vitest run src/compiler-runtime/renderable.test.ts`
- package builds for `@typed/compiler`, `@typed/app`, `@typed/ui`, `@typed/router`, `@typed/template`, `@typed/cli`, and `@typed/storybook`
- `pnpm --filter typed-realworld exec vmc -p tsconfig.json`
- `pnpm --filter typed-realworld storybook:build`
- `pnpm build`
- `pnpm exec oxlint ...` over touched TypeScript files
- `pnpm exec oxfmt --check ...` over touched TypeScript and RealWorld Storybook files
- `git diff --check`

## Memory Impacts

- short_term: Storybook runtime defaults should be consumed through `typed:storybook/runtime?path=/` in stories; hard-coding `./src/routes` from files already under `src/` causes doubled paths.
- stale_risk: If router/api virtual modules later support explicit project-root-relative targets, this guidance should be revisited.
- promotion: Defer until the Storybook integration stabilizes beyond this RealWorld fixture.
