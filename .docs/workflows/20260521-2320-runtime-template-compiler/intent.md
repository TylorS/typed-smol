# Intent

## Problem Statement

Typed currently has strong primitives across `@typed/template`, `@typed/fx`, `@typed/app`, and the virtual-module compiler stack, but the runtime/app layer still relies on mostly generic template rendering and generated app entrypoints. The next step is to create first-class runtime functions in `@typed/app` and a compiler-facing package surface, `@typed/compiler`, that can transform templates into optimized implementations for server and DOM environments.

This workflow should also define when dev-time HMR can preserve state safely for `Fx.gen` / `Fx.fn` programs by carrying eligible `RefSubject` instances across reloads.

## Desired Outcome

Build a strict, evidence-backed plan and implementation path for:

- `@typed/app` runtime functions that are the public app/runtime API surface for server, DOM, hydration, and HMR integration.
- `@typed/compiler` as the package or package alias responsible for compiling Typed templates into type-directed optimized output.
- Separate server and DOM compiled implementations, with shared type-directed analysis where appropriate.
- HMR behavior that preserves state only under explicit, safe conditions using `RefSubject` state handles.
- Tests and examples proving the compiler/runtime integration works without weakening type safety.

## Product Intent

Typed should feel like a framework with a compiler, not a collection of disconnected helper packages. Runtime functions should be small and explicit enough for users to understand, while the compiler should remove repetitive runtime work where type and template information make that safe.

## Architecture Intent

- Keep the virtual-module-first architecture.
- Treat `@typed/compiler` as a first-class compiler layer rather than hidden framework magic.
- Compile templates into target-specific output instead of forcing one generic runtime path for server and DOM.
- Preserve `Effect` error and context types through generated code.
- Preserve HMR state through typed runtime contracts rather than global ad hoc caches.

## Open Intent Questions

- Should `@typed/compiler` be a new package, a public rename/facade over `@typed/virtual-modules-compiler`, or a separate template compiler package that integrates with the existing virtual-module compiler?
- Should the first implementation tranche optimize only tagged `html` templates, or also route/browser/server virtual module output?
- Should HMR state preservation be driven by explicit user APIs, compiler-discovered stable keys, or both?
