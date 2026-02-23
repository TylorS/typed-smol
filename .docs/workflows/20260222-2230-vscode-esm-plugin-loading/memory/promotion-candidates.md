## Candidate 01: vmc-first resolver loading rule

- candidate: For virtual-modules integrations, prefer `loadVmcConfig` as primary resolver/plugin source, with explicit legacy fallback when required.
- evidence: VS Code resolver regression after ts-plugin/CLI migrated to vmc config.
- promotion_decision: promoted (codified as shared helper + cross-package migration in this workflow).

## Candidate 02: shared resolver bootstrap abstraction

- candidate: Keep vmc plugin/resolver bootstrap logic in `@typed/virtual-modules` (`loadResolverFromVmcConfig`, `loadPluginsFromEntries`) and forbid per-package reimplementation.
- evidence:
  - new core helper added in `packages/virtual-modules/src/VmcResolverLoader.ts`
  - consumers migrated: compiler, ts-plugin, VS Code resolver
  - targeted tests/builds passed across affected packages
- promotion_decision: promoted to `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`.
