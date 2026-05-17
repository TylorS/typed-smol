# RealWorld Workflow Memories

## Task 0 - ApiHandler Canonicalization

- `@typed/app` now uses route/method `ApiHandler(route, method, schemas?)(handler)` as the canonical public endpoint helper.
- The historical helper alias was removed from the package-root export surface, tests, docs, starter template, virtual-module sample docs, and HttpApi virtual-module specs.
- The old config-object `ApiHandler({ route, method, ... })(handler)` shape was removed from public tests to avoid two public helpers with the same name.
- Verification required building local workspace dependencies in this worktree before app tests could import `@typed/router` and `@typed/virtual-modules`.
- Dependency bootstrap used `pnpm install --no-frozen-lockfile --lockfile=false` so the unrelated dirty `pnpm-lock.yaml` was not modified by this task.

## Task 1 - Package Skeleton

- `examples/realworld` starts as the single package named `typed-realworld` with only approved runtime/dev dependencies.
- The build script intentionally compiles only non-test `src/**/*.ts`; Vitest owns `src/tests/**`.
- Database, Hurl, and Playwright scripts are present but fail loudly until their owning tasks wire real implementations.
- `typed.config.ts` uses `defineConfig` and declares the intended `api:` and `router:` prefixes; the first browser build avoids virtual imports so package wiring can be verified before route/API files exist.
- Local build verification in this worktree required building `@typed/virtual-modules-vite` and `@typed/vite-plugin` before Vite could load the workspace plugin package.

## Task 2 - Schema Baseline

- Response envelope schemas live in `src/domain/RealWorldApi.ts` and compose schemas from `Ids.ts`, `User.ts`, `Article.ts`, `Pagination.ts`, and `Errors.ts`.
- Article list responses intentionally use `ArticlePreview`, whose struct strips `body` on decode/encode while single article responses use full `Article`.
- Effect Schema `Struct` strips extra keys by default; the schema test locks this behavior for body-free article previews.
- Timestamps are modeled as branded ISO UTC strings for API compatibility instead of decoded DateTime values.
