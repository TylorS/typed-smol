# TypeInfoApi Enrichment Pattern

## Objective

Use TypeInfoApi more heavily at compile time to determine optimal render output. Move from AST/string matching on serialized TypeNode to checker-driven classification.

## Implemented Pattern

### 1. enrichExports Callback (TypeInfoApi)

- `CreateTypeInfoApiSessionOptions.enrichExports?: (params) => Partial<EnrichedExportMetadata>`
- Runs during snapshot creation; receives `{ symbol, exportedType, checker, filePath }`
- Return value is merged into `ExportedTypeInfo` (e.g. `runtimeKind`, `expectsRefSubject`)

### 2. ExportedTypeInfo Extended

- `ExportedTypeInfo` extends `EnrichedExportMetadata` (optional `runtimeKind`, `expectsRefSubject`)
- Plugin reads these when present; falls back to routeTypeNode classification when absent

### 3. createRouterAwareTypeInfoSession (@typed/app)

- Wraps `createTypeInfoApiSession` with `enrichExports` that classifies handler/template/default
- Uses checker: `getSignaturesOfType`, `getReturnTypeOfSignature`, `getTypeOfSymbolAtLocation`
- Classification: `runtimeKind` via type symbol/name (Fx, Effect, Stream); `expectsRefSubject` via first param type

### 4. Host Integration

- Sample verify script: uses `createRouterAwareTypeInfoSession` for router resolution
- ts-plugin: when `router-virtual-module` plugin is loaded, uses router-aware session (requires optional @typed/app)

## Reusable Pattern

When building type-driven code generators:

1. Add optional `enrichExports` to the session factory
2. Classify in the callback using checker APIs (symbol names, type structure)
3. Merge result into ExportedTypeInfo
4. Consumer prefers enriched fields, falls back to structural/TypeNode logic
