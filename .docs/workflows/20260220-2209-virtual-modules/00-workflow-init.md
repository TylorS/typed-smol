## Workflow Init

- objective: Design and implement a new package `@typed/virtual-modules` in `packages/virtual-modules` for synchronous, type-safe virtual module resolution with TypeScript Language Service integration and CLI support.
- started_at: 2026-02-20T22:09
- started_by: cursor-agent
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/stages/research.mdc`
  - `.cursor/rules/stages/requirements.mdc`
  - `.cursor/rules/stages/specification.mdc`
  - `.cursor/rules/stages/planning.mdc`
  - `.cursor/rules/stages/execution.mdc`
  - `.cursor/rules/stages/finalization.mdc`
  - Existing package conventions under `packages/*`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Entire virtual module API and plugin hooks must be synchronous.
  - Must support TypeScript Language Service plugin hooks and a `tsc`-like CLI workflow.
  - Should expose a simple JSON-like type information shape to plugin authors.
- initial risks:
  - TypeScript compiler APIs are complex and easy to leak into public API ergonomics.
  - Synchrony constraints can limit some resolution strategies.
