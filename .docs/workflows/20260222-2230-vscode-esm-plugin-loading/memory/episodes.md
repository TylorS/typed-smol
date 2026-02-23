## Episode 01

- objective: Restore ESM plugin loading in VS Code resolver.
- attempt: Inspect resolver inputs and compare with ts-plugin/compiler loading code paths.
- evidence: `packages/virtual-modules-vscode/src/resolver.ts` consumed only `compilerOptions.plugins[].plugins`; `vmc.config.ts` now owns plugin entries.
- outcome: Implemented vmc-first loading with legacy fallback; build/tests passed.

## Episode 02

- objective: Prevent future resolver/bootstrap drift across `virtual-modules-*` packages.
- attempt: Extract vmc resolver/plugin bootstrap into `@typed/virtual-modules` and migrate compiler, ts-plugin, and VS Code consumers.
- evidence: Added `packages/virtual-modules/src/VmcResolverLoader.ts` + tests and switched all three consumers to shared functions.
- outcome: Targeted tests/builds passed across core, compiler, ts-plugin, and VS Code packages.
