# Requirements

## Functional Requirements

### FR-01 Shared Diagnostics

`@typed/compiler` must expose a shared diagnostic model usable by CLI, Vite, TypeScript plugin, and VS Code surfaces.

Acceptance:

- Diagnostics include stable code, severity, message, source file, optional span, optional related information, and optional fix/code-action metadata.
- Existing compiler route/template diagnostics can be converted into this shared model.
- Virtual-module diagnostics can be adapted into this model without losing existing code/message/plugin information.

### FR-02 Serialization API In `@typed/app`

`@typed/app` must expose the public runtime serialization API for compiler/runtime boundaries.

Acceptance:

- Users can provide explicit schemas/serializers when they want better precision or performance.
- Compiler-generated serialization plans can reference the `@typed/app` API without depending on private internals.
- Unsupported runtime values produce shared diagnostics, not silent fallback behavior.

### FR-03 Type-Directed Schema Generation

When a user-provided schema is absent, the compiler must attempt type-directed Effect Schema generation.

Acceptance:

- Schema generation starts from compiler-visible TypeScript type facts.
- Safe first-tranche types include primitives, literals, readonly object properties, optional properties, arrays/tuples, simple unions, and records/index signatures where representable.
- Unsupported types such as functions, arbitrary classes, recursive types without support, symbols, and unknown generic shapes produce diagnostics.
- User-provided schemas override or short-circuit generated schema work.

### FR-04 Common TypeScript Service Layer

`@typed/compiler`, `@typed/vite-plugin`, TS plugin, and `vmc` must be able to share common TypeScript service/session helpers where practical.

Acceptance:

- The design avoids four separate TypeScript Program/Language Service implementations.
- Vite can use the same type facts as the CLI path when available.
- Editor diagnostics and build diagnostics should be produced from the same compiler logic.

### FR-05 Extensible `vmc`

`@typed/virtual-modules-compiler` must become an extensible TypeScript compiler framework in addition to virtual-module compilation.

Acceptance:

- Current `vmc` behavior remains compatible.
- A host extension API exists for compiler lifecycle hooks, direct module transforms, diagnostics, and shared type-service access.
- `@typed/compiler` can wrap `vmc` rather than duplicating compile/build/watch orchestration.

### FR-06 `@typed/compiler` CLI

`@typed/compiler` must provide a CLI that wraps `vmc` functionality and adds template/serialization compilation.

Acceptance:

- CLI supports normal compile, build mode, and watch mode through the underlying `vmc` framework.
- CLI emits shared diagnostics.
- CLI can be used as the build correctness path for template diagnostics that TS language-service plugins cannot enforce through `tsc`.

### FR-07 Template Vite Plugin

`@typed/compiler` must provide a template Vite plugin that directly transforms user modules.

Acceptance:

- Plugin scans user modules for `@typed/template` `html` tagged templates.
- Plugin uses shared compiler analysis and diagnostics.
- Plugin transforms user modules directly rather than emitting compiled templates as virtual modules.
- Plugin runs in build mode and can participate in dev/HMR later without splitting compiler facts.

### FR-08 `@typed/vite-plugin` Integration

`typedVitePlugin()` must include the template Vite plugin as part of the core framework surface.

Acceptance:

- Default `typedVitePlugin()` installs template compilation unless explicitly disabled by a documented option.
- Existing virtual-module plugin order and behavior remain compatible.
- Vite plugin tests prove the template plugin is registered with the expected ordering.

### FR-09 Template TypeScript Plugin Diagnostics

A template TS plugin surface must provide stronger editor diagnostics for `html` templates than public `@typed/template` types can express.

Acceptance:

- Diagnostics cover at least invalid HTML attributes, boolean attributes, event handler positions, property bindings, spreads, `.data`, and obvious component/template prop mismatches.
- Diagnostics map to the original tagged template source spans.
- Diagnostics use the same compiler diagnostic engine as CLI/Vite.

### FR-10 VS Code Integration

The VS Code extension must configure/cooperate with the template TS plugin and surface template tooling UX.

Acceptance:

- Extension can configure the TS plugin through VS Code's TypeScript extension API.
- Extension can display or augment template diagnostics without recomputing compiler logic independently.
- Code actions are planned only where the compiler diagnostic model provides fix metadata.

## Non-Functional Requirements

### NFR-01 Diagnostic Consistency

CLI, Vite, TS plugin, and VS Code diagnostics should disagree as little as possible.

Acceptance:

- Shared snapshot tests cover the same invalid template/source fixture across at least two hosts before implementation is called complete.

### NFR-02 Conservative Serialization

Serialization must fail closed.

Acceptance:

- Ambiguous type-directed schema generation produces diagnostics.
- Generated serializers/schemas are deterministic and stable under equivalent TypeScript type facts.

### NFR-03 Compatibility

Existing virtual-module behavior must continue to pass.

Acceptance:

- Existing `@typed/virtual-modules*`, `@typed/app`, and `@typed/vite-plugin` focused test suites remain green for touched surfaces.

### NFR-04 Test Strategy

Favor property/equivalence tests where practical.

Acceptance:

- Schema generation gets property or table-driven coverage over representable and rejected TypeNode shapes.
- Template transform tests compare compiler facts and transformed runtime behavior where feasible.

### NFR-05 Maintainable Compiler Architecture

Implementation code must stay DRY, easy to read, self-describing, and ready to scale into more capable compilation features and semantic analysis.

Acceptance:

- Shared concepts such as diagnostics, source spans, type facts, schema-generation results, template facts, and host adapters are centralized instead of duplicated per host.
- Core compiler functions are small, named by domain intent, and composed through explicit data types.
- Host-specific code for CLI, Vite, TS plugin, and VS Code remains thin and delegates semantic work to shared compiler modules.
- New abstractions must remove real duplication or represent a stable compiler concept; speculative framework layers are avoided.
- Requirements, specification, and plan must trace maintainability work explicitly instead of treating it as style-only cleanup.

## Design Choices Accepted From User

- Serialization API lives in `@typed/app`.
- User-provided schemas are an optimization/precision path.
- Type-directed Schema generation is attempted whenever no user schema is provided.
- Generated schemas are not primarily virtual modules.
- Template compilation directly transforms user modules.
- Diagnostics are make-or-break and must be shared across hosts.
- `@typed/compiler` needs a CLI that wraps `vmc`.
- `vmc` must become an extensible TypeScript compiler framework.

## Open Approval Questions

- Approve FR-01 through FR-10 as the required functional scope?
- Approve NFR-01 through NFR-04 as the non-functional gates?
- For the first implementation tranche, should we sequence substrate-first as:
  1. shared diagnostics,
  2. `vmc` extension hooks,
  3. `@typed/app` serialization API,
  4. type-directed Schema generation,
  5. template Vite direct transform,
  6. CLI/TS-plugin/VS Code host integration?
