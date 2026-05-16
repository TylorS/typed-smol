# Requirements — Typed Framework Evolution

Status: approved.

## Scope Boundary

These requirements cover the first implementation tranche: productionizing the virtual module compiler substrate and cross-surface generated artifact behavior. Router, HTTP API, Environment, type-config, and create-app work remain research/spec inputs until the compiler substrate contract is stable.

## Functional Requirements

- FR-1: The virtual module system must preserve `typed-virtual://` as the stable logical identity for virtual modules.
- FR-2: The virtual module system must materialize generated virtual module artifacts to disk by default under `node_modules/.typed/virtual`.
- FR-3: The generated artifact store must maintain a manifest/cache protocol that maps logical virtual identities to physical artifacts, input fingerprints, diagnostics, warnings, dependency descriptors, and metadata needed for reuse.
- FR-4: The manifest/cache protocol must include both per-artifact manifests and a project-level index.
- FR-5: Diagnostics and warnings must be stored in the per-artifact manifest; no separate diagnostic sidecar files are required for v1.
- FR-6: Cache reuse must be valid only when source hashes and relevant config, plugin, and compiler inputs match the manifest entry.
- FR-7: Plugin fingerprints must include the resolved plugin module file hash, package/version metadata when available, and explicit plugin config hash.
- FR-8: Compiler fingerprints must include the TypeScript version and the full parsed `tsconfig`.
- FR-9: Vite, vmc, the TypeScript plugin, and the VS Code extension must use the shared artifact contract instead of each maintaining incompatible materialization behavior.
- FR-10: Concurrent artifact generation must use atomic writes with last-valid-writer-wins semantics.
- FR-11: Generated artifacts must persist as cache entries by default and remain on disk until an explicit clean/prune action.
- FR-12: The compiler substrate must support virtual-to-virtual imports through stable logical identity and generated artifact resolution without passing unstable physical paths into plugin APIs.
- FR-13: The compiler substrate must surface plugin/build diagnostics consistently across Vite, vmc, TS plugin, and VS Code.
- FR-14: The compiler substrate must define explicit cleanup tooling for generated artifacts without making normal development flows prune the cache.

## Non-Functional Requirements

- NFR-1: Correctness must be content-addressed. Timestamp/watch events may trigger checks, but they must not be the correctness boundary for cache reuse.
- NFR-2: The manifest/cache format must be deterministic, inspectable, and stable enough for debugging generated artifacts.
- NFR-3: Disk writes must be atomic enough that readers never observe partially written source or manifest entries.
- NFR-4: The artifact store must be cross-process safe for common local development cases where Vite, tsserver, vmc, and VS Code run at the same time.
- NFR-5: The shared artifact layer must reduce duplicated recomputation across surfaces when inputs are unchanged.
- NFR-6: Existing plugin APIs should avoid unnecessary churn; higher-level app plugins must not need to depend on physical artifact paths.
- NFR-7: Generated source import rewriting/path handling must be robust enough for TypeScript module syntax used by current and planned app plugins.
- NFR-8: The implementation must fail clearly when manifests are corrupt, inputs are missing, or generated artifacts are stale.
- NFR-9: The first tranche must include regression coverage for single-process and multi-surface behavior before higher-level framework plugin implementation proceeds.

## Acceptance Criteria

- AC-1: A test demonstrates that a `typed-virtual://` logical identity maps to a deterministic `node_modules/.typed/virtual` artifact without exposing physical paths to plugin `build()` calls. Maps to FR-1, FR-2, FR-12, NFR-6.
- AC-2: A manifest entry records logical identity, physical source path, source hash, config/plugin/compiler fingerprints, dependencies, diagnostics, warnings, and generated source hash. Maps to FR-3, FR-6, NFR-1, NFR-2.
- AC-3: Cache validity can be checked atomically from a per-artifact manifest, while the project-level index supports discovery, debugging, and explicit cleanup. Maps to FR-4, FR-14, NFR-2, NFR-3.
- AC-4: A plugin diagnostic or warning is visible from the artifact manifest without requiring a separate diagnostic file. Maps to FR-5, FR-13, NFR-2.
- AC-5: A cache hit is reused only when all required input fingerprints match; changing source, config, plugin identity, or compiler inputs invalidates reuse. Maps to FR-6, NFR-1.
- AC-6: Changing a plugin implementation file, package/version metadata, or explicit plugin config invalidates cache reuse. Maps to FR-7, NFR-1.
- AC-7: Changing the TypeScript version or parsed `tsconfig` invalidates cache reuse. Maps to FR-8, NFR-1.
- AC-8: Vite and vmc can resolve the same virtual module through the shared artifact store and observe a cache hit on unchanged inputs. Maps to FR-9, NFR-5.
- AC-9: The TS plugin and VS Code extension no longer maintain separate incompatible disk materialization logic for normal generated artifacts. Maps to FR-9, NFR-6.
- AC-10: Concurrent writers cannot produce partially readable source or manifest files, and a later valid writer can replace an earlier valid entry. Maps to FR-10, NFR-3, NFR-4.
- AC-11: Generated artifacts remain on disk across process restarts and are reused when fingerprints match. Maps to FR-11, NFR-5.
- AC-12: An explicit clean/prune command or API removes generated artifacts without being invoked automatically by normal dev/build/typecheck flows. Maps to FR-11, FR-14.
- AC-13: Virtual-to-virtual imports continue to resolve correctly through the logical identity and artifact store. Maps to FR-12.
- AC-14: Diagnostics from plugin failures or stale/corrupt manifests are surfaced consistently in at least vmc and one editor/dev-server surface. Maps to FR-13, NFR-8.
- AC-15: Regression coverage proves that generated-source import handling supports static imports, re-exports, side-effect imports, and dynamic imports or explicitly documents unsupported syntax. Maps to NFR-7.

## Prioritization

- must_have:
  - FR-1 through FR-13
  - NFR-1 through NFR-8
  - AC-1 through AC-11, AC-13, AC-14
- should_have:
  - FR-14
  - NFR-9
  - AC-12, AC-15
- could_have:
  - Additional performance benchmarks beyond proving reduced duplicate recomputation.

## Open Questions

- None.
