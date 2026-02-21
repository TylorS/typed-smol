## Status

accepted

## Context

The package must provide type-safe virtual module generation while staying fully synchronous. It must support:

- editor integrations through TypeScript Language Service plugin environments, and
- `tsc`-like CLI type-checking flows where Language Service plugins are not loaded.

Additionally, plugin manager behavior now includes loading plugins from filesystem locations using Node module resolution semantics.

## Decision

Adopt a three-layer architecture:

1. **Synchronous core**:
   - `VirtualModulePlugin` contract (`shouldResolve`, `build`),
   - first-match plugin manager,
   - rich JSON-like type snapshot API with relative file and relative-glob directory query support.
2. **Host adapters**:
   - Language Service adapter for editor experiences.
   - Compiler-host adapter for CLI type-check workflows.
3. **Filesystem loader strategy**:
   - Resolve plugin modules via Node module resolution.
   - Load filesystem-resolved plugins synchronously via CommonJS.
   - Support preloaded plugin objects for ESM-first environments.
4. **Dependency tracking strategy**:
   - Type query operations can register file/directory-glob watch descriptors.
   - Directory-glob descriptors support recursive or non-recursive behavior.
   - Host adapters use descriptors to invalidate stale virtual outputs and recompute.

## Consequences

Positive:

- Keeps plugin author API minimal and synchronous.
- Reuses one core manager across editor and CLI surfaces.
- Supports filesystem-discovered plugins without forcing async boundaries.
- Allows virtual modules to depend on other files/directories via explicit, testable dependency descriptors.

Trade-offs:

- Synchronous filesystem loading implies CommonJS-loadable plugin modules when loaded from disk.
- Pure ESM plugins must be provided as preloaded plugin objects (or through future async extensions outside v1 scope).
- Recursive directory watches can increase invalidation fan-out; adapters need sensible debounce and cache invalidation policies.

## Alternatives considered

1. **Async plugin and loader APIs**:
   - Rejected due to hard requirement for synchronous module behavior.
2. **Language Service-only architecture**:
   - Rejected because `tsc` does not load LS plugins.
3. **Expose raw TypeScript APIs as primary plugin contract**:
   - Rejected for poor ergonomics and high coupling.

## References

- https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin
- https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- `.docs/specs/virtual-modules/requirements.md`
