## Functional Requirements

- FR-1: Provide a synchronous plugin interface for virtual modules with `name`, `shouldResolve(id, importer)`, and `build(id, importer, api)` hooks.
- FR-2: Provide a plugin manager that evaluates plugins in registration order and applies first-match resolution semantics.
- FR-3: Provide a rich, JSON-like type information API that can be requested by plugins without requiring direct TypeScript compiler API usage.
- FR-4: Provide a Language Service integration surface that can resolve and serve virtual module source in editor flows.
- FR-5: Provide a compiler-host integration surface usable by a `tsc`-like type-checking CLI workflow.
- FR-6: Ensure plugin hooks receive both requested module `id` and `importer` context for resolution/build decisions.
- FR-7: Provide deterministic behavior when no plugin resolves a module (explicit unresolved result and fallback path to TypeScript default resolution).
- FR-8: Provide a filesystem plugin loader that resolves plugin packages using Node module resolution semantics.
- FR-9: Allow plugin loading by either package name (resolved from a provided base path) or explicit file path.
- FR-10: Support synchronous module loading for resolved plugin entries and convert module exports to a normalized `VirtualModulePlugin` shape.
- FR-11: Type snapshots must expose structural kind metadata for complex TypeScript types, including at least union, intersection, record/object, array, tuple, function/signature, primitive, literal, reference, and unknown/any/never categories.
- FR-12: Type information API must support querying by relative file path, resolved from an explicit base directory (e.g. importer directory or project root).
- FR-13: Type information API must support querying by one or more relative glob patterns for directory/file-set selection, with explicit recursive and non-recursive traversal modes.
- FR-14: File and directory-glob query operations must support dependency registration for watch targets so changed files can trigger virtual module recomputation.

## Non-Functional Requirements

- NFR-1: All public plugin and manager hooks are strictly synchronous and do not accept Promise-returning handlers.
- NFR-2: Public type-information payloads are plain object / array / primitive structures suitable for JSON serialization.
- NFR-3: Type extraction supports efficient repeated queries in editor workflows via cacheable access patterns.
- NFR-4: Integrations are compatible with TypeScript 5.9.x and avoid assumptions tied to a different TS runtime version.
- NFR-5: Package API remains minimal and composable for both editor and CLI consumers.
- NFR-6: Failure behavior is explicit (typed error/diagnostic structure) and does not crash host flows on plugin miss or build exceptions.
- NFR-7: Filesystem plugin loading remains synchronous end-to-end; unresolved packages or invalid exports return structured load errors.
- NFR-8: Node-resolution behavior is deterministic and testable across project-root and importer-relative resolution bases.
- NFR-9: Rich type snapshots use a stable discriminated-union schema that plugins can consume without TypeScript internals.
- NFR-10: Relative-path, glob expansion, and directory traversal behavior is deterministic across platforms (path normalization and stable match ordering).
- NFR-11: Watch-target registration from file/directory queries is synchronous and produces serializable dependency descriptors.

## Acceptance Criteria

- AC-1 (FR-1, FR-2, FR-6): Given multiple plugins, when the first plugin with `shouldResolve(...) === true` is found, only that plugin `build(...)` is used and receives `id` and `importer`.
- AC-2 (FR-2, FR-7): Given no matching plugin, manager returns an unresolved outcome without throwing, allowing host fallback.
- AC-3 (FR-3, NFR-2): Given a resolvable symbol in target context, the API returns a rich JSON-like snapshot including symbol name, declaration kind, and type text.
- AC-4 (FR-4, NFR-1): Language Service integration can resolve virtual module content via synchronous manager calls only.
- AC-5 (FR-5, NFR-1, NFR-6): Compiler-host integration can include virtual modules in type-checking and report diagnostics without async behavior.
- AC-6 (NFR-1): Public TypeScript signatures for plugin hooks reject Promise-returning implementations.
- AC-7 (NFR-3): Repeated type snapshot queries for the same module/import context do not require full recomputation in the common case.
- AC-8 (FR-8, FR-9): Given a plugin package name and base path, plugin manager resolves the package with Node module resolution and attempts to load it.
- AC-9 (FR-10, NFR-7): Given a resolved module exporting either `default` or named plugin object, manager normalizes and validates the plugin synchronously.
- AC-10 (NFR-7, NFR-8): Given an unresolvable package or invalid export, loader returns a deterministic structured error without crashing host integration.
- AC-11 (FR-11, NFR-9): Given queried symbols with complex types, snapshots include explicit `kind` metadata and nested structural details (e.g. union members, tuple elements, function parameters/return type, object properties).
- AC-12 (FR-12, NFR-10): Given a relative file path and base directory, API resolves and returns type snapshot information for that file deterministically.
- AC-13 (FR-13, NFR-10): Given one or more relative globs and a base directory, API returns deterministic type snapshot results for matched files, limited to immediate scope in non-recursive mode and full subtree in recursive mode.
- AC-14 (FR-14, NFR-11): Given watch registration enabled on file/directory-glob queries, changing a matched file marks dependent virtual modules stale and triggers recomputation in host integrations.

## Prioritization

- must_have:
  - FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14
  - NFR-1, NFR-2, NFR-6, NFR-7, NFR-8, NFR-9, NFR-10, NFR-11
  - AC-1 through AC-6, AC-8 through AC-14
- should_have:
  - NFR-3
  - AC-7
- could_have:
  - Additional resolver composition modes beyond first-match in a future iteration.
