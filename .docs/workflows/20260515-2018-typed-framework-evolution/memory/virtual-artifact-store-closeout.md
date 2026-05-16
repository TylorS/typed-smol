# Virtual Artifact Store Closeout Memory

- `typed-virtual://` remains the logical identity. Physical generated files live under `node_modules/.typed/virtual`.
- Per-artifact manifests are the correctness boundary; the project index is for discovery/debugging/cleanup and may be missing without invalidating otherwise valid manifests.
- Cache reuse depends on source, plugin/config/package, compiler, tsconfig, generated-source, and dependency fingerprints. Missing correctness fingerprints must fail closed.
- `VirtualArtifactStore.clean()` is explicit only. Normal resolve/build/typecheck flows must not prune generated artifacts.
- Cleanup and materialization serialize through `node_modules/.typed/virtual.cleanup.lock`, which sits outside the deleted artifact root.
- Downstream package tests that consume compiled `@typed/virtual-modules` exports need a fresh core build first.
- For final integration evidence, run compiler tests before Vite tests, then run both `pnpm -r build` and root `pnpm build`.
