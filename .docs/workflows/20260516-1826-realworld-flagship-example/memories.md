# RealWorld Workflow Memories

## Task 0 - ApiHandler Canonicalization

- `@typed/app` now uses route/method `ApiHandler(route, method, schemas?)(handler)` as the canonical public endpoint helper.
- The historical helper alias was removed from the package-root export surface, tests, docs, starter template, virtual-module sample docs, and HttpApi virtual-module specs.
- The old config-object `ApiHandler({ route, method, ... })(handler)` shape was removed from public tests to avoid two public helpers with the same name.
- Verification required building local workspace dependencies in this worktree before app tests could import `@typed/router` and `@typed/virtual-modules`.
- Dependency bootstrap used `pnpm install --no-frozen-lockfile --lockfile=false` so the unrelated dirty `pnpm-lock.yaml` was not modified by this task.
