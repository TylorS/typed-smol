# Memories

- `typed dev` is the app-facing alias for the existing development server behavior; `typed serve` remains as a compatibility alias.
- `typed build` now runs the virtual-module compiler internally before the Vite client/server production build.
- `typed check` is intentionally non-mutating: virtual-module/TypeScript no-emit check, oxlint, and oxfmt check. Tests remain under `typed test`.
- Starter scripts should not expose raw `vite` or `vmc`; the root app contract is `typed dev`, `typed build`, `typed preview`, `typed check`, and `typed test`.
- RealWorld’s full package skeleton test currently has unrelated dirty-worktree drift in `src/tests/presentation/ssr.test.ts:109`; use the focused script-contract test when validating this CLI slice.
- RealWorld VMC currently fails because its dirty `vmc.config.ts` imports `@typed/app/ComposableVirtualModulePlugin` before that app package output is available in `dist`.

