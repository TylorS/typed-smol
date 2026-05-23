# Memories - Typed DevTools Chrome Extension

## Durable Notes

- Use one protocol-owned id surface in `@typed/devtools-protocol`; downstream packages must import these ids instead of redeclaring branded strings.

## Task Notes

### T1

- Protocol ids are centralized in `packages/devtools-protocol/src/Ids.ts` and remain plain strings at runtime.
- Keep downstream packages importing id constructors/types from `@typed/devtools-protocol`; do not redeclare brands locally.
- New publishable workspace packages need both `pnpm-lock.yaml` importer wiring and `scripts/publish-beta.sh` topo-order wiring in the same task that creates the package.
