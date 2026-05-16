## Workflow Init

- objective: Plan Typed's evolution from a set of libraries into a full-fledged, opinionated framework with a productionized disk-backed virtual module compiler, hardened `@typed/app` router and HTTP APIs, environment/config virtual modules, and create-app template.
- started_at: 2026-05-15 20:18:18 EDT
- started_by: Codex, with human-provided objective
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/SKILL.md`
  - `.docs/_templates/workflow-init.md`
  - `.docs/_templates/brainstorming.md`
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/typed-config/spec.md`
  - `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
  - `.docs/workflows/20260225-2100-typed-config-unification/03-plan.md`
  - `packages/app/AGENTS.md`
  - `packages/virtual-modules-compiler/AGENTS.md`
  - `packages/virtual-modules/src/internal/VirtualRecordStore.ts`
  - `packages/virtual-modules/src/internal/path.ts`
  - `packages/virtual-modules/src/internal/materializeVirtualFile.ts`
  - `packages/virtual-modules-vscode/src/virtualPreviewDisk.ts`
  - `packages/virtual-modules-compiler/src/compile.ts`
  - `packages/virtual-modules-vite/src/vitePlugin.ts`
  - `packages/virtual-modules-ts-plugin/src/plugin.ts`
  - `packages/vite-plugin/src/index.ts`
  - `packages/app/src/config/TypedConfig.ts`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Mode: strict.
  - Finalization strategy: PR.
  - Follow strict stage order: brainstorming, research, requirements, specification, planning, execution, finalization.
  - Treat existing `.docs/workflows/` folders as reference-only.
  - Do not mutate implementation code during Phase 1 planning.
  - All app virtual module plugins remain always enabled through `createTypedViteResolver`.
- initial risks:
  - Current durable virtual-modules spec still describes in-memory `typed-virtual://` files as canonical, while code already has disk materialization paths under `node_modules/.typed/virtual`; productionizing disk-backed output requires an explicit contract update.
  - This is a multi-stream framework effort touching compiler identity, filesystem persistence, Vite/TS/vmc/VS Code coherence, router/runtime behavior, HTTP API plugins, env/config surfaces, and app scaffolding.
  - Subagent policy triggers likely apply to later broad research and planning, but this Codex environment only allows spawning subagents when the user explicitly asks for subagent or parallel agent work.
