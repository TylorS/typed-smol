# Brainstorming

## Working Shape

The new work has two connected tracks:

1. Serialization/resumability contract
   - Put the public/runtime serialization API in `@typed/app`.
   - Give the compiler a way to prove values crossing route/HMR/build/runtime boundaries are serializable.
   - Prefer explicit `Effect.Schema` when users provide it because it is the best precision/performance path.
   - Generate schemas from types whenever no user schema is provided and the type is representable.
   - Emit diagnostics when a value is compiler-visible but not serializable.

2. Template tooling pipeline
   - Reuse `@typed/compiler` template analysis as the shared source of truth.
   - Add a build-mode Vite plugin that directly transforms user modules for optimized templates.
   - Include it from `@typed/vite-plugin`.
   - Add TS plugin/editor diagnostics for tighter `html` template constraints than generic public types can express.
   - Let the VS Code extension configure the TS plugin and surface template diagnostics/actions.
   - Add an `@typed/compiler` CLI that wraps `vmc` with template/serialization functionality.
   - Make `vmc` extensible as a TypeScript compiler framework, not only as a virtual-module compiler.

## Early Design Bets

- A `@typed/compiler` template IR should be the shared contract between Vite, TS plugin, and VS Code.
- Runtime serialization should be schema-backed, not JSON-stringify-by-convention.
- Type-directed Schema generation should be the normal fallback path, with explicit schemas as an optimization and precision override.
- Build-time template optimization and editor-time template validation should share parsing/facts/diagnostic production but not share every execution dependency.
- The compiler should not model compiled templates as virtual modules by default; it should transform user modules directly.
- Vite and `vmc` should share common TypeScript services where practical so diagnostics and type-directed generation have the same facts.

## Open Questions

- What exact `@typed/app` serialization API shape gives the compiler enough metadata without making application code verbose?
- Which type shapes are safe for type-directed schema generation in the first tranche?
- Where do generated schemas live during compilation if they are not virtual modules?
- How aggressive should editor diagnostics be before the Vite/vmc build path enforces the same checks?
- What `vmc` extension points are needed for `@typed/compiler` to wrap it cleanly?

## Stage Exit Contract

- Decisions made: start a fresh strict workflow; treat the HttpApi test drift as a separate preflight fix; keep serialization in `@typed/app`; use explicit schemas as optimization; default to type-directed schema generation when absent; directly transform user modules; make diagnostics shared across CLI/Vite/TS plugin/VS Code; plan an `@typed/compiler` CLI that wraps extensible `vmc`.
- Evidence used: package AGENTS files, current Vite plugin integration, current virtual TS plugin and VS Code extension responsibilities, focused HttpApi test output, current Vite/TypeScript/VS Code docs.
- Open risks/questions: listed above.
- Next stage readiness: ready after human approval of `intent.md` and `scope.md`.
