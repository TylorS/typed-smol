# Lint and Type-Check Checkpoint

## Problem

Lint and type errors were sometimes left in modified code because validation did not explicitly require `ReadLints` or `tsc -b` before completing tasks.

## Improvement

Add mandatory lint/type-check gates to:

1. **Execution Stage** (Per-Task Loop step 4): Run ReadLints on modified files; run pnpm build/tsc -b before marking task complete.
2. **Self-Improvement** (Verification Gate): Call ReadLints and resolve type errors before final response.
3. **Finalization** (Cohesion Check): Verify lint/type-check clean before closing.

## Implementation

- `.cursor/rules/stages/execution.mdc` — Validate step now includes explicit ReadLints + build/tsc requirement.
- `.cursor/rules/self-improvement.mdc` — Verification Gate extended with lint/type-check bullet.
- `.cursor/rules/stages/finalization.mdc` — Cohesion Check now includes lint/type-check verification.

## Evidence

- Root cause: no explicit checkpoint; agents sometimes skipped lint/typecheck.
- Fix: low-risk rule updates; no code changes; applies to future runs.
