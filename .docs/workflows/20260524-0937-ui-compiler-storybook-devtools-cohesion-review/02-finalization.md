## What Changed

- Added RealWorld Storybook configuration, scripts, and dependencies.
- Added root-level RealWorld stories for the shell and home route.
- Wired RealWorld Storybook runtime defaults through `typed.config.ts` and `vmc.config.ts`.
- Fixed Storybook preview typing so Fx story mounting does not falsely erase required environments before runtime layers are applied.

## Validation Performed

- `pnpm --filter typed-realworld exec vmc -p tsconfig.json`
- `pnpm --filter typed-realworld storybook:build`
- `pnpm build`
- focused package tests and builds listed in `01-review.md`
- `pnpm exec oxlint ...`
- `pnpm exec oxfmt --check ...`
- `git diff --check`

## Known Residual Risks

- Storybook and RealWorld builds still warn about server-oriented Node imports being externalized for browser compatibility.
- The non-fatal virtual-modules warning `options.id must not contain null bytes` still appears during RealWorld and Storybook Vite builds.
- No browser-interaction smoke was added for clicking through the built stories.

## Follow-up Recommendations

- Add a focused virtual-modules regression for null-byte Vite ids.
- Add a Storybook smoke test for RealWorld stories after the browser harness is settled.

## Workflow Ownership Outcome

- active_workflow_slug: 20260524-0937-ui-compiler-storybook-devtools-cohesion-review
- explicit_reuse_override: false

## Memory Outcomes

- captured_short_term: yes, in `01-review.md`.
- promoted_long_term: no.
- deferred: promote Storybook runtime-default guidance only after one more fixture or integration proves the pattern.

## Cohesion Check

- The final slice keeps Storybook as a consumer of app virtual modules and does not move router/api ownership into Storybook.
- RealWorld uses the same virtual-module defaults path as app/plugin configuration instead of duplicating router/api targets inside stories.

## Self-Improvement Loop

- observed_friction: root build failure first surfaced as a VMC config load message, then direct VMC exposed the path-resolution failure.
- diagnosed_root_cause: Story files used explicit `./src/*` virtual targets from within `src/`; duplicate nested stories also required unsupported parent traversal.
- improvements: Direct VMC reproduction was added to the validation trail before rerunning root build.
- validation_of_improvement: direct VMC, Storybook build, and root build all pass.
- consolidated: unresolved warnings are documented as residual risks, not hidden.
- applied_next_step: staged finalization-ready workflow docs with exact evidence.
