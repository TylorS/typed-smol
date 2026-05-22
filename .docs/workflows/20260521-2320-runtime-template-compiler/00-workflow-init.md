## Workflow Init

- objective: Define and execute the strict workflow for first-class runtime functions in `@typed/app` plus an `@typed/compiler` surface that compiles `@typed/template` templates into type-directed optimized server and DOM implementations, with HMR state preservation for eligible `Fx.gen` / `Fx.fn` programs through `RefSubject` state.
- started_at: 2026-05-21T23:20:19-04:00
- started_by: Codex with human-selected mode `strict` and finalization strategy `pr`.
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/SKILL.md`
  - `.cursor/skills/effect-module-effect/SKILL.md`
  - `.cursor/skills/effect-module-layer/SKILL.md`
  - `.cursor/skills/effect-module-scope/SKILL.md`
  - `.cursor/skills/effect-module-stream/SKILL.md`
  - `packages/app/AGENTS.md`
  - `packages/template/AGENTS.md`
  - `packages/fx/AGENTS.md`
  - `packages/app/src/index.ts`
  - `packages/app/src/internal/emitBrowserSource.ts`
  - `packages/app/src/internal/emitServerSource.ts`
  - `packages/template/src/index.ts`
  - `packages/template/src/Template.ts`
  - `packages/template/src/Parser.ts`
  - `packages/fx/src/Fx/index.ts`
  - `packages/fx/src/RefSubject/index.ts`
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/virtual-modules/spec.md`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Run mode is `strict`; required stage order is brainstorming, research, requirements, specification, planning, execution, finalization.
  - Finalization strategy is `pr`.
  - The workflow folder is run-owned; existing workflow folders are reference-only.
  - Generated framework/runtime code must stay virtual-module-first and must not introduce actual filesystem routing.
  - Emitted virtual-module output must be executable, type-safe TypeScript.
  - Existing uncommitted work is present in the checkout; do not revert or overwrite unrelated changes.
  - Effect-related design must follow router-first Effect skill loading.
  - Subagent routing check: this is broad and multi-stream work, but the current multi-agent tool policy only allows spawning when the human explicitly asks for subagents. Direct execution is used until explicit subagent permission exists.
- initial risks:
  - `@typed/compiler` could overlap with the existing `@typed/virtual-modules-compiler`; the intended package boundary must be clarified.
  - Template optimization can easily become too broad unless the first tranche defines a narrow optimization target.
  - HMR state preservation must be opt-in or statically safe enough to avoid preserving stale incompatible state.
  - Server and DOM compiled outputs must preserve `Effect` error/context typing rather than erasing it.
