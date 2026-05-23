## Workflow Init

- objective: Plan a first-party Typed Storybook integration that learns from the old `@typed/storybook` renderer while moving toward a Next/Remix/SvelteKit-style meta-framework integration capable of exercising server-side code, HttpApi layers, routing, SSR, and UI/component stories together.
- started_at: 2026-05-22T20:49:33-0400
- started_by: Codex
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.docs/_templates/workflow-init.md`
  - `.docs/_templates/brainstorming.md`
  - `.docs/workflows/20260515-2018-typed-framework-evolution/intent.md`
  - `.docs/workflows/20260515-2018-typed-framework-evolution/scope.md`
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260516-1643-vavite-backed-typed-http-server.md`
  - `packages/app/AGENTS.md`
  - `packages/app/src/ServerVirtualModulePlugin.ts`
  - `packages/app/src/BrowserVirtualModulePlugin.ts`
  - `packages/app/src/internal/emitServerSource.ts`
  - `packages/app/src/internal/emitBrowserSource.ts`
  - `packages/app/src/config/TypedConfig.ts`
  - `packages/vite-plugin/src/index.ts`
  - `packages/ui/src/HttpRouter.ts`
  - `examples/realworld/src/server.ts`
  - `examples/realworld/src/browser.ts`
  - old `TylorS/typed` `packages/storybook` package, package metadata, preset, preview, renderer, and types
  - Storybook v10.2.9 framework and portable stories documentation
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Mode is `strict`.
  - Finalization strategy is `merge` into `codex/typed-beta`.
  - Existing workflow folders are reference-only.
  - Existing dirty working tree changes are treated as user or parallel work and must not be reverted.
  - Phase 1 artifacts remain draft until explicitly approved.
  - Effect-related planning must route through the repo's Effect skill-loading policy before technical assertions become implementation decisions.
  - Available subagent tool use is restricted to explicit user requests, so this Phase 1 pass proceeds by direct execution and records that constraint.
- initial risks:
  - Storybook integration can collapse into a browser-only renderer if we overfit to the old package.
  - Server-side stories need a clear boundary between framework runtime, story sandbox, app layers, request simulation, and real network serving.
  - Typed's virtual-module-first architecture must remain explicit; this workflow must not introduce hidden filesystem routing or local module shims.
  - Storybook's framework API and server/runtime behavior are version-sensitive, so later research must stay tied to current official docs and local package versions.
