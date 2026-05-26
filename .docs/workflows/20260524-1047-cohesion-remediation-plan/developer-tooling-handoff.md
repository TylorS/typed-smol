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
- subagent_routing: direct execution for this checkpoint because the callable subagent tool requires explicit user delegation.

- blocker: upstream local acceptance requires `hurl`, but `command -v hurl` returned exit code 1 in this environment
- owner: environment prerequisite
- handoff status: blocked before `pnpm --filter typed-realworld test:acceptance:local`; do not treat acceptance as verified
- failing command: `command -v hurl && pnpm --filter typed-realworld exec playwright install chromium`
- exact error: `command -v hurl` produced no path and exited 1
- required next action: install Hurl, then rerun `pnpm --filter typed-realworld test:acceptance:local`

- null-byte virtual id warning: not observed in the final non-acceptance gates after cache regeneration
- browser externalization warnings: still observed during RealWorld build and Storybook build for server-oriented Node imports; no build failure observed, but this remains a developer-tooling/runtime bundling follow-up
- compiler HMR warning: fixed in cohesion remediation by emitting Vite-detectable `import.meta.hot.accept(` calls; verified with `pnpm --filter typed-realworld test:hmr:local`
- Vite/TS plugin/VS Code diagnostics: untouched by this remediation pass

## 2026-05-25 Human Handoff Update

- status: human explicitly expanded this workflow to include developer-tooling and DevTools truthfulness work
- newly_allowed_surfaces:
  - `packages/virtual-modules-vscode`
  - `packages/virtual-modules-ts-plugin`
  - `packages/virtual-modules` language-service hot paths needed by the TS plugin
  - generated HttpApi client type-safety in `packages/app`
  - compiler/template server runtime behavior for `CurrentComputedBehavior`
  - DevTools protocol/runtime/Chrome panel instrumentation
  - focused type-cast remediation in touched surfaces
- still_requires_coordination:
  - broad Vite null-byte virtual-id cleanup unrelated to the above symptoms
  - unrelated compiler CLI architecture beyond proving whether `typed check` should load compiler extensions
  - large visual redesign of the DevTools panel before live data truthfulness is fixed

## Current Root-Cause Findings

- VS Code tree: `VirtualModulesTreeProvider` resolves imports against the workspace folder root, so monorepo app imports such as RealWorld are filtered out when the repo root lacks `vmc.config.ts`; discovery must use `getProjectRoot(importer)` per file.
- TS plugin responsiveness: no direct hover wrapper was found; likely blocking comes from synchronous fallback `Program` creation, type-target bootstrap `createProgram`, TypeInfo session creation, artifact fingerprinting, dependency hashing, and stale record rebuilds on language-service request paths.
- Generated client: `TypedClientInput` maps `HttpApiClient.ForApi<typeof Api, any, any>` methods to `(...args) => unknown`, which erases endpoint return and channel types.
- Compiler runtime: Vite builds use `@typed/compiler`, but `typed check`/plain `vmc` do not load compiler extensions; compiled server template runtime also bypasses the `CurrentComputedBehavior = "one"` layer used by interpreted SSR.
- DevTools panel: current panel initializes from fixture stream items even when no live runtime stream is connected, so tabs can imply functionality that the inspected app did not provide.
