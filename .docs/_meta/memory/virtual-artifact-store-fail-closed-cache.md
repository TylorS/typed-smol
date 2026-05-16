# Virtual Artifact Store: Fail-Closed Cache Validity

- **Rule:** Artifact-store cache hits must be accepted only after current source, dependency, plugin/config/package, compiler, tsconfig, and generated-source fingerprints validate.
- **Fail closed:** Missing or unavailable correctness fingerprints block cache reuse instead of falling back to timestamp or watch-event assumptions.
- **Dependency descriptors:** TypeInfo `api.file()` and `api.directory()` dependency descriptors must be included in fingerprint validation before accepting a manifest hit.
- **Generated outputs:** Paths under `node_modules/.typed/virtual` are cache outputs, not source inputs; exclude them from source-root fingerprinting.
- **Long-lived adapters:** Watch and language-service adapters must revalidate hot process-local virtual records so in-memory records cannot bypass manifest/fingerprint checks.
- **Diagnostic boundary:** Failed plugin-build diagnostic-only manifests are intentionally deferred until a separate diagnostic-artifact design exists.
