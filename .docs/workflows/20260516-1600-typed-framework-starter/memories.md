# Typed Framework Starter Memories

- `typed:server` and `typed:browser` must keep `run()` composable by returning `Effect`s; executable entrypoints should decide when to call `Effect.runPromise`.
- Entry-adjacent companion files use named dotfiles such as `.layout.ts` and `.dependencies.ts` next to the importing server/browser entry.
- Starter templates should avoid `catalog:` and external `workspace:*` specifiers except for packages inside the generated workspace.
- `@typed/cli` must stay on the same beta train as `@typed/app`, `@typed/router`, and `@typed/vite-plugin` for `typed create` workspaces to install cleanly after publish.
