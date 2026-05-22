## Workflow Init

- objective: Simplify the current `@typed/compiler` runtime compiler implementation while preserving forward progress toward optimizing all `@typed/template` `html` templates in all environments and expanding Typed application compilation with HMR through `RefSubject`.
- started_at: 2026-05-22T19:08:02-04:00
- started_by: Codex with human-selected mode `strict` and finalization strategy `merge`.
- source_context_reviewed:
  - `AGENTS.md`
  - `packages/compiler/AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.docs/_templates/workflow-init.md`
  - `.docs/_templates/brainstorming.md`
  - `.docs/workflows/20260521-2320-runtime-template-compiler/00-workflow-init.md`
  - `.docs/workflows/20260521-2320-runtime-template-compiler/01-brainstorming.md`
  - `.docs/workflows/20260521-2320-runtime-template-compiler/02-research.md`
  - `.docs/workflows/20260521-2320-runtime-template-compiler/scope.md`
  - `.docs/workflows/20260521-2320-runtime-template-compiler/requirements.md`
  - `packages/compiler/src/index.ts`
  - `packages/compiler/src/template/TemplatePlan.ts`
  - `packages/compiler/src/template/analyzeTemplate.ts`
  - `packages/compiler/src/template/emitDomTemplate.ts`
  - `packages/compiler/src/template/emitServerTemplate.ts`
  - `packages/compiler/src/hmr/analyzeComponentHmr.ts`
  - `packages/compiler/src/hmr/dependencies.ts`
  - `packages/compiler/src/hmr/viteHmr.ts`
  - `packages/compiler/src/hmr/closureContext.ts`
  - `packages/compiler/src/capabilities/compileCapabilities.ts`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Run mode is `strict`; required stage order is brainstorming, research, requirements, specification, planning, execution, finalization.
  - Finalization strategy is `merge`.
  - This workflow folder is run-owned; existing workflow folders are reference-only.
  - `@typed/compiler` integrates with `@typed/virtual-modules-compiler`; it does not replace `vmc`.
  - The compiler must optimize all `@typed/template` `html` templates.
  - Stateful HMR remains limited to route components and participating dependencies with stable `RefSubject`/service/context identity.
  - Effect-related design must follow router-first Effect skill loading before technical assertions or code edits involving Effect APIs.
  - Subagent routing check: this is structural refactor planning and requirements extraction, but the available subagent tool policy only permits spawning after explicit human request for subagents. Direct execution is used unless the human explicitly asks for subagents.
- initial risks:
  - The existing compiler code already contains several partially overlapping planning layers; simplification must remove accidental complexity without deleting required compiler/HMR capability.
  - Regex-based source analysis may be too fragile for the intended HMR boundary.
  - Current DOM/server emitters look runtime-like rather than codegen-oriented, so "compiler" responsibilities need sharper boundaries.
  - Broad all-`html` optimization can become unbounded unless capability stages are explicit.
