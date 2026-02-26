# App VM Plugins Always Enabled — Self-Improvement Loop

## Objective

Make the invariant "all @typed/app VM plugins are always enabled" durable and documented so it holds for current and future plugins.

## Observed Friction

- The HttpApi plugin was previously optional (enabled only when `apiVmOptions` was set), creating inconsistency with the router plugin.
- No single source of truth for "when adding a new app plugin, ensure it's registered in vite-plugin."

## Diagnosed Root Cause

Lack of an explicit invariant in code and AGENTS.md meant the pattern could drift when adding new plugins.

## Improvements Applied

1. **Invariant comment in vite-plugin** (`packages/vite-plugin/src/index.ts`): Added block comment above `createTypedViteResolver`: "ALL @typed/app VM plugins are always registered. There are no optional or conditional app plugins. When adding a new VM plugin to @typed/app, add it here."

2. **Constraint in @typed/app AGENTS.md**: Added to Constraints: "All app VM plugins are always enabled in typedVitePlugin. New plugins must be added to `createTypedViteResolver` and are never optional." Also updated Architecture to state "all app VM plugins are always enabled (no optional/conditional registration)."

## Validation

- `pnpm --filter @typed/vite-plugin test` — 7 tests pass.

## Reusable Pattern

**Invariant documentation**: When establishing a cross-package invariant (e.g., "X is always Y"), document it in:

- A comment at the implementation site (where the invariant is enforced)
- AGENTS.md Constraints in the owning package
- Architecture section when it affects integration points

This prevents drift when new contributors add features.
