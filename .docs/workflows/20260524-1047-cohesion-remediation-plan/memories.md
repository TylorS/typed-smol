# Memories

- `@typed/app/runtime` is the browser handoff boundary for compiled DOM templates. Generated browser modules should import route/action/devtools runtime helpers through `@typed/app/runtime`, not directly from `@typed/devtools-runtime`.
- Clearing `examples/realworld/node_modules/.typed` can expose stale virtual-module output. Rerun `pnpm --filter typed-realworld exec vmc -p tsconfig.json` before treating cache-missing virtual targets as source failures.
- `typed-realworld test` must exclude `src/tests/hmr/**`; those files are Playwright tests and are run through `pnpm --filter typed-realworld test:hmr:local`.
- The installed `oxlint` in this workspace rejects category flags such as `--correctness-category`. RealWorld overrides lint categories to `{}` in `typed.config.ts` so `typed check` uses a compatible lint invocation.
- `typed-realworld test:acceptance:local` remains unverified until Hurl is installed; `command -v hurl` exited 1 on 2026-05-24.
