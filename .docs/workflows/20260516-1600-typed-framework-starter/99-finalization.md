# Finalization - Typed Framework Starter

Status: complete.

## Pull Request

- PR: https://github.com/TylorS/typed-smol/pull/3
- Branch: `codex/typed-beta`
- Base: `main`
- State: open, ready for review.
- Merge state: clean.
- GitHub checks: no checks reported for this branch at finalization time.

## Delivered Scope

- Added framework virtual modules for `typed:env`, `typed:config`, `typed:html`, `typed:server`, and `typed:browser`.
- Kept framework entry generation virtual-module based; no actual filesystem routing was introduced.
- Added entry-adjacent companion files for server/browser entries such as `.layout.ts` and `.dependencies.ts`.
- Kept `typed:server` and `typed:browser` `run()` exports composable by returning `Effect`s.
- Added `TypedHttpServer.layer(...)` as the framework-aware server layer boundary.
- Integrated vavite runnable-handler support through `@typed/vite-plugin`.
- Updated generated `api:` server wiring to delegate through `TypedHttpServer.layer(...)`.
- Added `typed create <name>` and a multi-package pnpm starter workspace.
- Added focused tests, scaffold tests, and a built-CLI e2e smoke for `typed create`.

## Verification

- `pnpm --filter @typed/app exec vitest run src/ServerVirtualModulePlugin.test.ts src/BrowserVirtualModulePlugin.test.ts src/ConfigVirtualModulePlugin.test.ts`
- `pnpm --filter @typed/app build`
- `pnpm --filter @typed/cli build`
- `pnpm --filter @typed/cli test -- create`
- `pnpm --filter @typed/virtual-modules-ts-plugin test`
- `pnpm -r run test`
- `pnpm -r run build`
- `pnpm build`
- `git diff --check`

All listed verification commands passed before finalization.

## Known Follow-Ups

- Publish `@typed/cli@1.0.0-beta.4` so generated starter workspaces can install the aligned beta CLI from npm.
- Replace placeholder development certificate material with real generated certificate/key material before treating SSL generation as production-grade.
- Harden `TypedHttpServer.layer(...)` from a descriptor boundary into a concrete Effect HTTP layer as the runtime server contract matures.
- Add a full scaffold install/build fixture once the aligned beta package set is published.

## Local Checkout Notes

The following pre-existing or unrelated local files were left unstaged and are not part of the PR:

- `README.md`
- `pnpm-lock.yaml`
- `scripts/publish-beta.sh`
- `tsconfig.build.json`
- `tsconfig.json`
- `.cursor/hooks/`
- `packages/threads/`
