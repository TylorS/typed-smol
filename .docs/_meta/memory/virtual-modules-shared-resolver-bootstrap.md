## Virtual Modules: Shared Resolver Bootstrap

- **Rule:** Do not duplicate vmc resolver/plugin bootstrap logic across `virtual-modules-*` packages. Use shared helpers from `@typed/virtual-modules`:
  - `loadResolverFromVmcConfig(...)`
  - `loadPluginsFromEntries(...)`
- **Why:** Duplicated bootstrap logic caused config-source drift (`tsconfig` plugin list vs `vmc.config.ts`) and user-facing breakage in VS Code integration.
- **Scope:** `packages/virtual-modules-compiler`, `packages/virtual-modules-ts-plugin`, `packages/virtual-modules-vscode`, and future integrations.
- **Allowed variation:** Consumers may differ only in policy after bootstrap (fatal exit, log-and-continue, legacy fallback), not in bootstrap mechanics.
- **Validation sequence:** When new exports are added to `@typed/virtual-modules`, rebuild it before running dependent package tests/builds.
- **Source evidence:** `.docs/workflows/20260222-2230-vscode-esm-plugin-loading/`, `packages/virtual-modules/src/VmcResolverLoader.ts`.
