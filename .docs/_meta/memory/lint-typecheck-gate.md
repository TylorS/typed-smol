# Lint and Type-Check Gate

**Rule:** Before completing any task or finalizing a run, call `ReadLints` on modified files and run `pnpm build` (or `tsc -b`) to ensure no lint or type errors remain.

**Where enforced:**

- Execution Stage (Per-Task Loop): Validate step requires ReadLints + build/tsc.
- Self-Improvement (Verification Gate): Before final response.
- Finalization (Cohesion Check): Before closing.

**Rationale:** Catch type/lint issues early; avoid merging broken code. Canonical rules: `.cursor/rules/stages/execution.mdc`, `.cursor/rules/self-improvement.mdc`, `.cursor/rules/stages/finalization.mdc`.
