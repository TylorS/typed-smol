# ADR: Compiler Direct Transforms And Extensible VMC

## Status

proposed

## Context

Typed already has a virtual-module-first framework substrate, a virtual module artifact store, and a focused `@typed/compiler` package for template/app compiler work.

The next tranche requires:

- direct user-module transforms for `html` template compilation;
- a serialization API in `@typed/app`;
- type-directed Effect Schema generation;
- shared diagnostics across CLI, Vite, TS plugin, and VS Code;
- an `@typed/compiler` CLI that wraps `vmc`;
- `vmc` becoming extensible enough to host non-virtual-module compiler work.

This appears to conflict with earlier guidance that `@typed/compiler` must not replace `vmc`. The refined boundary is that `@typed/compiler` should wrap and extend `vmc` as a compiler framework, while `vmc` continues owning TypeScript compile/build/watch orchestration and virtual-module host integration.

## Decision

Adopt direct user-module transforms for template compilation, and extend `vmc` into a TypeScript compiler framework that supports host extensions.

- `@typed/compiler` does not emit compiled templates primarily as virtual modules.
- `@typed/compiler` transforms user modules directly in CLI and Vite hosts.
- `@typed/compiler` CLI wraps `vmc` instead of duplicating `tsc` orchestration.
- `vmc` keeps existing virtual-module behavior and adds extension hooks for source transforms, diagnostics, lifecycle, and shared type-service access.
- Shared diagnostics become the correctness boundary across CLI, Vite, TS plugin, and VS Code.

## Consequences

Positive:

- Template compilation is applied to real user modules where Vite/Rollup expect transforms.
- `vmc` remains the TypeScript compiler substrate and avoids duplicated compiler orchestration.
- Virtual modules remain the framework-generated surface for router/API/env/config/etc.
- Diagnostics can be made consistent across all hosts.
- The design scales to richer semantic analysis without making each host reimplement compiler logic.

Trade-offs:

- `vmc` needs a more general extension API before `@typed/compiler` CLI can be clean.
- The compiler core must maintain strong host-neutral boundaries.
- Vite transforms and `vmc` transforms must share enough TypeScript facts to avoid drift.

## Alternatives considered

1. Emit compiled templates as virtual modules:
   - Rejected because the user explicitly wants direct module transforms and because template compilation is a source transform, not a generated framework surface.
2. Build a separate `@typed/compiler` tsc wrapper independent of `vmc`:
   - Rejected because it duplicates TypeScript orchestration and risks drift from virtual-module behavior.
3. Put all serialization and compiler APIs in `@typed/compiler`:
   - Rejected because runtime serialization belongs in `@typed/app`; compiler planning belongs in `@typed/compiler`.
4. Let each host produce its own diagnostics:
   - Rejected because diagnostics are a make-or-break feature and host drift would undermine trust.

## References

- `.docs/specs/serializable-template-tooling/spec.md`
- `.docs/specs/serializable-template-tooling/testing-strategy.md`
- `.docs/workflows/20260522-2104-serializable-template-tooling/requirements.md`
- `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`
- `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
- `.docs/specs/virtual-modules/spec.md`
- `.docs/specs/virtual-module-artifact-store/spec.md`

