## Workflow Init

- objective: Harden the implementation of the Router and HttpApi virtual-module plugins in `@typed/app`, using tests as evidence for correctness rather than treating test expansion as the primary deliverable.
- started_at: 2026-05-16T09:57:33-04:00
- started_by: Codex
- source_context_reviewed:
  - `AGENTS.md`
  - `packages/app/AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/SKILL.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/router-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
  - `packages/app/package.json`
  - root `package.json`
  - `git status --short --branch`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Mode: `strict`
  - Finalization strategy: `pr`
  - Follow stage order: brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization.
  - Phase 1 documents must include `intent.md` and `scope.md`; do not commit or continue past Phase 1 until the human explicitly approves those documents.
  - All workflow artifacts for this run live under `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/`.
  - Use tests to prove implementation hardening, with property tests favored where practical.
- initial risks:
  - The original request was corrected from test-suite hardening to implementation hardening; avoid scoping this as a coverage-only task.
  - Router and HttpApi plugins both depend on Effect and TypeInfo behavior, so implementation claims must be grounded in repo code and the Effect ownership guidance.
  - Repo policy requires subagent routing for specialist work, but this Codex environment only allows spawning subagents when the user explicitly asks for subagents. Direct execution is being used until/unless the human requests parallel/specialist agents.
