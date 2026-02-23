# Workflow Init: TypeInfoApi-driven Render Output

- objective: Lean harder into TypeInfoApi to determine optimal render output at compile time; extend classification from AST/string matching to checker-aware enrichment.
- started_at: 2025-02-22
- started_by: self-improvement-loop
- source_context: RouterVirtualModulePlugin uses routeTypeNode (string/structural matching on serialized TypeNode). TypeInfoApi provides rich type data; checker has assignability and symbol info not exposed to plugins.
- explicit_reuse_override: false
