# Promotion Candidates

- Final `TypedCompilerDiagnostic` shape and adapter semantics after host integrations prove stable.
- Final `VmcCompilerExtension` API shape if later CLI/Vite/compiler tasks do not require major changes.
- Final `Serializable.GeneratedSchemaPlan` metadata shape after M4 schema planning proves the compiler/runtime boundary.
- Final `SchemaGenerationPlan` fingerprint payload after template transforms consume generated descriptors.
- Consider keeping `reportExtensionDiagnostics` as the single extension diagnostic reporting path for future CLI/Vite integrations.
