# Promotion Candidates

- Final `TypedCompilerDiagnostic` shape and adapter semantics after host integrations prove stable.
- Final `VmcCompilerExtension` API shape if later CLI/Vite/compiler tasks do not require major changes.
- Final `Serializable.GeneratedSchemaPlan` metadata shape after M4 schema planning proves the compiler/runtime boundary.
- Final `SchemaGenerationPlan` fingerprint payload after template transforms consume generated descriptors.
- Consider keeping `reportExtensionDiagnostics` as the single extension diagnostic reporting path for future CLI/Vite integrations.
- Consider standardizing hoisted `TemplateStringsArray.typedTemplatePlan` metadata if the Vite plugin and TS plugin can consume it without a separate sidecar manifest.
- Consider keeping `runVmcCli` as the single CLI orchestration layer for `vmc`, `@typed/compiler`, and future framework-specific compiler hosts.
