# Workflow Init

- **objective**: Replace hardcoded `returnTypeAssignableTo`, `firstParamAssignableTo`, `returnTypeEffectSuccessAssignableTo` with a composable type projection system on `TypeTargetSpec`, enabling arbitrary sub-type extraction before assignability checks.
- **started_at**: 2026-02-24T21:30
- **started_by**: user
- **source_context**: User request to make type specs composable with generics (e.g. `Fx<*TARGET, *, *>`, `Stream<*TARGET, *, *>`). Current system has 4 hardcoded extraction paths in `serializeExport()`. Plan file `typeinfoapi_production_improvements_12886eaa.plan.md` referenced.
- **explicit_reuse_override**: false
