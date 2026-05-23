# Memory Episodes

## M1 - Shared Diagnostics

- Added `@typed/compiler` shared diagnostics with stable sorting/fingerprinting and pure adapters for TypeScript, virtual-module, and Vite-shaped diagnostics.
- Kept host adapters dependency-light: no Vite or VS Code imports in compiler core.
- Preserved existing route/template diagnostics for compatibility; migration is deferred until host consumers need the shared model.

## M2 - Extensible VMC Framework Hooks

- Added `VmcCompilerExtension` as an additive `@typed/virtual-modules-compiler` API.
- Threaded source transform and diagnostic hooks through compile/build/watch entrypoints.
- Verified focused extension behavior and the existing compiler package suite.

## M3 - `@typed/app` Serialization API

- Added `Serializable.schema(...)` for explicit Effect Schema descriptors.
- Added `Serializable.generated(...)` as the public placeholder for compiler-owned schema generation metadata.
- Added `Serializable.fromSchemaOrGenerated(...)` to encode the user-schema precedence rule without exposing compiler internals in `@typed/app`.

## M4 - Type-Directed Schema Planning

- Added `@typed/compiler` schema plans over the existing `TypeNode` model.
- Supported primitives, literals, objects, optional properties, arrays, tuples, unions, and string/number index signatures.
- Unsupported shapes fail closed through shared compiler diagnostics.
- Added descriptor-source emit that references `Serializable.generated(...)`.

## Review Fix - Compiler Extension And Schema Hardening

- Build-mode extension diagnostics now affect the returned exit code.
- Watch-mode extension diagnostics now report through the configured diagnostic reporter.
- Source transform host attachment updates existing host state instead of stacking wrappers.
- Serializable generated descriptor metadata now accepts a plan root, and compiler emit includes it.
- Bigint literal schema plans preserve bigint values and stable fingerprints.

## M5 - Template Module Analysis And Direct Transform Core

- Added `analyzeTemplateModule` over TypeScript `SourceFile` with `@typed/template` named alias and namespace import detection.
- Module analysis records tagged template spans, tag spans, quasi spans, expression spans, local variable names, and existing `TemplatePlan` facts.
- Added `transformTemplateModule` that hoists template strings with attached `typedTemplatePlan` metadata and rewrites typed tagged templates to equivalent `html(templateStrings, ...values)` calls.
- Templates without imported typed `html` bindings remain unchanged, preserving the interpreted fallback path.

## M6 - `@typed/compiler` CLI

- Extracted `runVmcCli` from the `vmc` executable so CLI argument parsing, init, compile, build, and watch flows are reusable by Typed compiler hosts.
- `runVmcCli` accepts compiler extensions and forwards them through compile, build, and watch modes.
- Added `createTypedCompilerExtension` as the first `@typed/compiler` extension, installing the template module transform into the shared `vmc` compiler host path.
- Added the `typed-compiler` bin to `@typed/compiler`.

## M7 - Template Vite Plugin

- Added `typedTemplateVitePlugin` to `@typed/compiler`.
- The plugin runs as a Vite `enforce: "pre"` transform, filters JavaScript and TypeScript module ids, calls `transformTemplateModule`, and returns `{ code, map: null }` only when source changes.
- Shared compiler diagnostics are reported through the Vite hook context with `diagnostics: "error" | "warn" | "silent"`.
- `@typed/vite-plugin` registers the template transform before `virtual-modules` and exposes `templates: false` as the rollback switch.

## M8 - Template TS Plugin Diagnostics

- Added `getTemplateDiagnostics` to `@typed/compiler`; it reuses `analyzeTemplateModule` and converts shared compiler diagnostics to `ts.Diagnostic`.
- `@typed/virtual-modules-ts-plugin` now appends template diagnostics from `getSemanticDiagnostics` after installing the virtual-module language-service adapter.
- The TS plugin build bundles `@typed/compiler` so editor hosts do not need to bridge the plugin's CommonJS output to compiler ESM at runtime.
