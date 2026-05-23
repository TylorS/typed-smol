# Research

## Source Context

- `packages/compiler/src/index.ts`
- `packages/compiler/src/template/TemplatePlan.ts`
- `packages/compiler/src/template/analyzeTemplate.ts`
- `packages/compiler/src/route/analyzeRouteModule.ts`
- `packages/compiler/src/route/RouteModulePlan.ts`
- `packages/app/src/index.ts`
- `packages/app/src/internal/frameworkDiagnostics.ts`
- `packages/vite-plugin/src/index.ts`
- `packages/virtual-modules/src/types.ts`
- `packages/virtual-modules/src/TypeInfoApi.ts`
- `packages/virtual-modules/src/LanguageServiceAdapter.ts`
- `packages/virtual-modules-vite/src/vitePlugin.ts`
- `packages/virtual-modules-compiler/src/cli.ts`
- `packages/virtual-modules-compiler/src/compile.ts`
- `packages/virtual-modules-compiler/src/build.ts`
- `packages/virtual-modules-ts-plugin/src/plugin.ts`
- `packages/virtual-modules-vscode/src/extension.ts`
- Current Vite, TypeScript LS plugin, and VS Code extension docs checked through Context7.

## Findings

### `@typed/compiler`

- Current package has no CLI/bin entry.
- Current exports are pure analysis/planning/emission utilities.
- Template analysis currently starts from `TemplateStringsArray`, not a full user module transform.
- `TemplatePlan` captures parsed HTML shape and dynamic part locations, but not TypeScript source ranges, expression types, or diagnostic spans.
- Route analysis already uses TypeScript AST over source text and emits route/HMR facts, but diagnostics are local and not compatible with virtual-module diagnostics or editor diagnostics.

### `@typed/app`

- `@typed/app` already owns framework-level virtual-module plugins and exports framework integration surfaces.
- `frameworkDiagnostics.ts` is very small and only models virtual-module-style diagnostics.
- Existing HttpApi code already treats `Effect.Schema` as a first-class app contract.
- `ConfigVirtualModulePlugin` already has a narrow serialization diagnostic for config values, but there is no general serialization API.

### `@typed/vite-plugin`

- `typedVitePlugin()` currently installs:
  - native tsconfig path shim;
  - `virtualModulesVitePlugin(...)`;
  - optional vavite integration;
  - optional analyzer;
  - optional compression.
- It creates a Language Service-backed TypeInfo session from collected virtual-module type target specs.
- It does not yet install a user-module transform plugin.
- This is the correct framework entrypoint for enabling a default template Vite plugin.

### `@typed/virtual-modules`

- `TypeInfoApi` already serializes TypeScript types into a durable `TypeNode` union.
- `TypeInfoApi` already supports `file`, `directory`, `resolveExport`, and `isAssignableTo`.
- `TypeNode` is a good substrate for type-directed Schema generation, but it lacks schema-generation-specific result/diagnostic modeling.
- `VirtualModuleDiagnostic` is too narrow for shared compiler diagnostics because it has no source span, severity, suggestions, related info, or host mapping.

### `@typed/virtual-modules-compiler` / `vmc`

- `vmc` owns CLI orchestration for normal compile, `--build`, and `--watch`.
- Compile/build paths currently wire the virtual-module compiler host adapter directly.
- There is no public host extension API for non-virtual-module transforms, diagnostics, or program lifecycle hooks.
- To let `@typed/compiler` wrap `vmc`, `vmc` needs an extensible compiler framework layer beneath the current CLI.

### `@typed/virtual-modules-vite`

- Current Vite plugin is a `resolveId`/`load` virtual-module integration.
- It transforms generated virtual TypeScript source with Vite's Oxc/esbuild path.
- It materializes virtual artifacts and reports virtual-module warnings/errors via console warnings.
- It is not the right place for direct user-module template transforms, but its TypeInfo session and artifact/fingerprint lessons are reusable.

### `@typed/virtual-modules-ts-plugin`

- TS plugin currently configures virtual-module resolution and diagnostics through `attachLanguageServiceAdapter`.
- It loads `typed.config.ts` and `vmc.config.ts`, merges framework VM plugins, and creates TypeInfo sessions.
- It does not yet run `@typed/compiler` template diagnostics over ordinary source files.
- It has the right project/config/type-service context to host editor-time template diagnostics once the compiler exposes a shared diagnostic engine.

### `@typed/virtual-modules-vscode`

- VS Code extension owns virtual-module navigation, preview, tree view, refresh, definitions, links, and references.
- It does not currently own a template diagnostic collection or code-action surface.
- VS Code docs confirm extension-side configuration can call the built-in TypeScript extension API's `configurePlugin(...)`.
- Best split: TS plugin computes template diagnostics; VS Code extension configures the plugin and optionally mirrors/surfaces code actions/navigation.

## External Docs Notes

- Vite plugin APIs support `transform` for direct user-module transforms and `resolveId`/`load` for virtual modules. Template compilation belongs in a direct transform plugin, not the current virtual-module plugin.
- TypeScript language service plugins can augment editor diagnostics/completions but do not affect `tsc` output. Build correctness must come from `vmc`/`@typed/compiler` CLI and Vite.
- VS Code extension APIs provide diagnostics, code actions, and TypeScript plugin configuration. The extension can cooperate with the TS plugin instead of reimplementing compiler checks.

## Research Conclusions

- Shared diagnostics are the first substrate requirement.
- Shared TypeScript service access is the second substrate requirement.
- `vmc` should expose compiler framework hooks before `@typed/compiler` CLI wraps it.
- Type-directed Schema generation should use `TypeNode` as input, with explicit unsupported-type diagnostics.
- Template Vite support should be implemented as a direct `transform` plugin and included by `typedVitePlugin()`.
- Editor support should reuse the compiler diagnostic engine through the TS plugin, with VS Code handling configuration and UX.

## Stage Exit Contract

- Decisions made: research confirms the user's direct-transform and shared-diagnostics direction.
- Evidence used: code paths listed above plus current Vite/TypeScript/VS Code docs.
- Open risks/questions: exact public serialization API shape, exact `vmc` extension hook names, and first tranche of type-to-Schema support.
- Next stage readiness: ready to review requirements.

