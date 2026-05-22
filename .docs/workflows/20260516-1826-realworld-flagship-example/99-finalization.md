# Finalization - RealWorld Flagship Example

Date: 2026-05-22

## Decisions Made

- Finalized on the main worktree branch `codex/typed-beta`.
- Kept PR #3 as the active PR for this work instead of opening a duplicate.
- Made local acceptance-wrapper tests hermetic: package tests prove scripts reference `.temp/references/realworld` and do not vendor specs, while the local wrapper commands remain responsible for failing clearly when the upstream checkout is absent.
- Added `happy-dom` as an example-scoped dev dependency because RealWorld presentation tests import it directly.

## Evidence Used

- `git merge-base --is-ancestor origin/codex/realworld-flagship-example HEAD`
- `pnpm --filter typed-realworld typecheck`
- `pnpm --filter typed-realworld test`
- `pnpm --filter typed-realworld build`
- `pnpm --filter @typed/ui test`
- `pnpm --filter @typed/ui build`
- `pnpm --filter @typed/app exec vitest run src/RouterVirtualModulePlugin.test.ts src/HttpApiVirtualModulePlugin.test.ts src/BrowserVirtualModulePlugin.test.ts src/ServerVirtualModulePlugin.test.ts`
- `git diff --check`

## Open Risks

- `typed-realworld build` still reports a large client chunk and browser-externalized Node modules from virtual-module internals. Build succeeds, but client/server split hygiene remains follow-up work.
- The local SQLite native binding may need `npm run build-release` inside `node_modules/.pnpm/better-sqlite3@12.10.0/node_modules/better-sqlite3` after Node upgrades.
- Hurl and upstream Playwright acceptance wrappers require local tools and `.temp/references/realworld`; they are intentionally not wired into CI in this first PR.

## Readiness

- Branch `codex/typed-beta` is ready for PR review with RealWorld, framework runtime, and `@typed/ui` substrate work included.
