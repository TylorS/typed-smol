## Workflow Init

- objective: Produce an execution-ready plan to align combinators across `packages/fx` modules/submodules with canonical Effect conventions by combining internal refactors with additive combinator parity work.
- started_at: 2026-02-22T22:57
- started_by: gpt-5.3-codex-xhigh
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/planning.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/*`
  - `packages/fx/src/**`
  - `packages/fx/README.md`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - existing public APIs must remain behaviorally compatible (no breaking changes to current symbols)
  - additive combinators may be introduced to close gaps with the Effect API surface
  - preserve dual data-first/data-last ergonomics for transformation combinators
  - align naming with Effect conventions (`fromX`, `mapError`, `runX`, `catchCause`)
- initial risks:
  - semantic confusion from `catchAll` alias behavior
  - inconsistent dual coverage in `Fx` combinators
  - thin direct tests for complex combinators (for example `keyed`, loop/cause families)
