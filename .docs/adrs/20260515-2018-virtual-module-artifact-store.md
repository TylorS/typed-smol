## Status

accepted

## Context

Typed's virtual module stack currently has multiple materialization paths. The durable virtual-modules spec describes virtual files as `typed-virtual://` in-memory sources, while implementation already writes or points some generated files into `node_modules/.typed/virtual`. Vite, vmc, the TypeScript plugin, and the VS Code extension can recompute or materialize generated modules independently.

Typed's framework evolution requires a production-grade compiler substrate before higher-level app plugins add more generated surfaces.

## Decision

Adopt a shared virtual module artifact store:

- Keep `typed-virtual://` as the portable logical identity.
- Use `node_modules/.typed/virtual` as the default physical artifact root.
- Require both per-artifact manifests and a project-level index.
- Validate cache reuse from source hashes plus config, plugin, and compiler fingerprints.
- Store diagnostics and warnings in per-artifact manifests.
- Use atomic writes with last-valid-writer-wins semantics for concurrent local writers.
- Treat generated artifacts as persistent cache entries until explicit clean/prune.

## Consequences

Positive:

- Higher-level app plugins can rely on one stable generated-artifact contract.
- Vite, vmc, TS plugin, and VS Code can share generated work instead of each owning incompatible materialization behavior.
- Cache correctness is based on content and compiler inputs rather than timestamps.
- `typed-virtual://` remains portable for non-local/debug/editor scenarios.

Trade-offs:

- The artifact-store implementation is a required foundation before new framework plugin implementation.
- Manifest schema and fingerprint computation become part of the compiler substrate contract.
- The initial implementation is more complex than write-through generated files.

## Alternatives considered

1. Disk paths as the public TypeScript identity:
   - Rejected because `typed-virtual://` is more portable and better separates logical virtual identity from local cache layout.
2. Write-through files without manifest/cache protocol:
   - Rejected because the stated framework goals require cross-surface reuse and correctness checks.
3. Strict single-builder lock protocol:
   - Rejected for v1 in favor of simpler atomic writes with last-valid-writer-wins.
4. Automatic eager pruning:
   - Rejected because generated files are intended to function as a persistent cache.

## References

- `.docs/workflows/20260515-2018-typed-framework-evolution/requirements.md`
- `.docs/workflows/20260515-2018-typed-framework-evolution/02-research.md`
- `.docs/specs/virtual-module-artifact-store/spec.md`
- `.docs/specs/virtual-modules/spec.md`
- `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
