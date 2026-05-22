## Workflow Init

- objective: Research 2026 web-platform, accessibility, and Ariakit-aligned best practices for a lasting `@typed/ui` component substrate in the `bcaf` worktree.
- started_at: 2026-05-22T17:44:21-0400
- started_by: Codex
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/research.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `packages/ui/src/Link.ts`
  - `packages/ui/src/index.ts`
  - `.docs/workflows/20260516-1826-realworld-flagship-example/requirements.md`
  - reference-only memory from prior `@typed/ui` Ariakit tranche
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Use `/Users/tylorsteinbergher/.codex/worktrees/bcaf/typed-smol`.
  - Keep prior workflow folders reference-only.
  - Do not modify package code during this research pass.
  - Preserve existing branch work and ignore unrelated `.cursor/hooks/` dirtiness.
- initial risks:
  - `bcaf` does not yet contain the previously prototyped `DataAttr`, `StartupRef`, `Dom`, `Disclosure`, `Dialog`, or `Popover` files.
  - Some promising platform APIs are Baseline 2025/2026 or still emerging; requirements must distinguish durable foundations from optional progressive enhancement.
  - Subagent routing is required by repo policy for broad research, but the available subagent tool is restricted to explicit user requests for subagents.
