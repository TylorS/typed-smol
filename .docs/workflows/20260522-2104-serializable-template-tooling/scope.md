# Scope

## In Scope

- Define a first-class serialization API in `@typed/app` for compiler/runtime boundaries.
- Decide how explicit serialization declarations, `Effect.Schema`, and type-directed schema generation fit together.
- Treat user-provided schemas as optimization/precision hints, not as a mandatory authoring burden.
- Use type-directed schema generation whenever a user-provided schema is absent and the type can be safely represented.
- Identify which value categories must become serializable:
  - route/module closure captures;
  - `RefSubject.Service` state identities and snapshots;
  - Effect Context service references needed by resumable continuations;
  - template interpolation metadata needed by build/runtime handoff;
  - template props/attrs/events/spreads for editor diagnostics.
- Add a template Vite plugin surface that can run `@typed/compiler` template analysis/optimization during build mode.
- Integrate that template Vite plugin into `@typed/vite-plugin` as part of the default framework plugin set once requirements/spec are approved.
- Shape a template TypeScript plugin surface for stronger diagnostics on tagged `html` templates.
- Shape VS Code extension integration for diagnostics/code actions/config handoff around template safety.
- Preserve current `@typed/template` runtime typing while adding a more precise compiler/editor layer above it.
- Add or plan an `@typed/compiler` CLI that wraps `vmc` behavior with compiler template/serialization functionality.
- Make `vmc` extensible enough to act as a TypeScript compiler framework used by `@typed/compiler`, while preserving its current virtual-module role.
- Transform user modules directly for template compilation instead of representing compiled templates as virtual modules.
- Reuse common TypeScript services with `vmc`/Vite where practical, without making template compilation a virtual-module output path.
- Fix narrow verification drift that blocks confidence in the current virtual-module test suite.

## Out Of Scope

- Replacing `@typed/virtual-modules-compiler`.
- Replacing TypeScript's type system or requiring a TypeScript fork for this tranche.
- Filesystem routing.
- Rewriting `@typed/template` rendering wholesale before the compiler/plugin contracts are approved.
- Serializing arbitrary JavaScript heap state without explicit schema/type-directed support.
- Emitting compiled templates primarily as virtual modules.
- Building a production marketplace VS Code release flow in this tranche.

## Current Assumptions

- Serialization APIs belong in `@typed/app`.
- Explicit `Effect.Schema` should be the highest-confidence and fastest serialization source.
- Type-directed schema generation is the default fallback: if a type cannot be represented safely, the compiler should surface a diagnostic instead of guessing.
- Vite build integration should likely be a dedicated template plugin internally, but exposed through `typedVitePlugin()` by default.
- The TypeScript language service plugin can add editor diagnostics and completions, but build correctness still belongs to `vmc`, Vite, and tests.
- The VS Code extension should configure/cooperate with the TS plugin and own editor UX such as diagnostics display, code actions, and navigation.
- Template editor safety should target the actual parsed template language: HTML elements, known attributes, boolean attributes, event handlers, property bindings, spreads, `.data`, and Typed component/template call surfaces.
- Diagnostics are make-or-break and should be produced from a shared compiler diagnostic layer so CLI, Vite, TS plugin, and VS Code disagree as little as possible.
- Direct module transforms are the intended Vite/build mechanism for templates.

## Phase 1 Acceptance

Phase 1 is complete only when the human explicitly approves `intent.md` and `scope.md`.

After approval, commit these docs and continue to strict-mode research.
