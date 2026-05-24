## What Changed

- Fixed generated typed API client channel inference for custom `HttpClient.With<E, R>` clients.
- Re-exported typed API client constructors from the Storybook runtime virtual module and moved RealWorld stories to consume the generated runtime client.
- Added Vite null-byte resolver guards and regression coverage.
- Added review/finalization artifacts for the cohesion follow-up.

## Validation Performed

- Focused template, compiler, virtual-modules Vite, app, and DevTools tests listed in `01-review.md`.
- Root build and RealWorld VMC reproduction for the failing integration gate.
- `pnpm exec oxlint` over current modified files.
- `git diff --check`.
- `pnpm build`: passed after fixes.
- `pnpm --filter typed-realworld storybook:build`: passed after fixes.
- `pnpm --filter typed-realworld typecheck:stories`: passed after fixes.
- `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts`: passed after fixes.
- `pnpm --filter @typed/app exec vitest run src/StorybookVirtualModulePlugin.test.ts`: passed after fixes.
- `pnpm --filter @typed/virtual-modules-vite exec vitest run src/vitePlugin.test.ts`: passed after fixes.

## Known Residual Risks

- Transformed template runtime execution is not covered for Effect-valued parts.
- Storybook RealWorld HTTP-server mode is intentional; the accepted runtime-harness-first ADR/spec now need a second-stage update.

## Follow-up Recommendations

- Add executable transformed-template tests for `Effect` parts before relying on the narrowed runtime boundary.
- Update the Storybook ADR/spec to record that RealWorld has advanced to the HTTP-server fidelity layer.

## Workflow Ownership Outcome

- active_workflow_slug: 20260524-1027-cohesion-alignment-followup-review
- explicit_reuse_override: false

## Memory Outcomes

- captured_short_term: yes, in `01-review.md`.
- promoted_long_term: no.
- deferred: generated-client ergonomics and Storybook HTTP-server lessons should be promoted only after fixes land and ADR/spec updates are complete.

## Cohesion Check

- Current branch passes the root build and RealWorld Storybook build after the generated-client fix.
- The remaining cohesion issue is the template compiler value-kind/runtime coverage gap for Effect-valued template parts.
- Clarified intent: custom-client E/R propagation is correct; default client APIs should not force those channels onto users.

## Self-Improvement Loop

- observed_friction: branch state changed during review as another commit and uncommitted edits landed.
- diagnosed_root_cause: multiple agents are still working on the same branch, so package-local tests can pass while cross-package generated artifacts drift.
- improvement: rechecked `git status`, rebuilt source packages, and reran RealWorld VMC after noticing generated artifacts were stale.
- validation: RealWorld VMC still failed after rebuilding `@typed/app`; after more concurrent edits landed, the failure moved from generated artifacts to `src/.browser.dependencies.ts` and `src/Api.ts`, confirming the channel issue is still source-level.
