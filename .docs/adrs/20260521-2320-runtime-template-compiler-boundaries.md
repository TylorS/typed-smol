# ADR: Runtime Template Compiler Boundaries

Status: proposed

## Context

Typed is adding compiler-powered template optimization and runtime functions across `@typed/app`, `@typed/template`, `@typed/fx`, and the existing virtual-module compiler stack. The work could blur several boundaries: `@typed/compiler` versus `@typed/virtual-modules-compiler`, general template optimization versus stateful HMR, and lexical HMR keys versus state services.

## Decision

Create `@typed/compiler` as a focused template/app compiler package. It integrates with existing virtual-module hosts and the artifact store, but it does not replace `@typed/virtual-modules-compiler` / `vmc`.

Optimize all `@typed/template` `html` templates through compiler IR and server/DOM emitters.

Limit stateful HMR to route components and compiler-visible participating dependencies. Use service-first `RefSubject.Service` identity for preserved state. Lexical/compiler keys are fallback metadata and diagnostics, not the primary state model.

Specify closure-to-context rewriting now, but implement it after service-backed `RefSubject` HMR is working.

## Consequences

- The compiler package has a clear purpose and does not absorb the `vmc` host-adapter role.
- All templates get an optimization path, but HMR state preservation remains constrained to stable component/dependency boundaries.
- HMR state reuse is typed and service-backed instead of anonymous lexical cache state.
- Closure preservation has a future path without requiring arbitrary closure serialization.

## Alternatives considered

- Make `@typed/compiler` a facade over `@typed/virtual-modules-compiler`: rejected because it blurs host adapter and template compiler responsibilities.
- Put compiler hooks only in `@typed/app`: rejected because the user explicitly wants a compiler package and because app runtime/compiler roles would become tangled.
- Use compiler-generated lexical keys as the main HMR identity: rejected in favor of `RefSubject.Service` identity.
- Apply stateful HMR to every optimized `html` template: rejected because optimization and state-preserving HMR have different safety boundaries.

## References

- `.docs/workflows/20260521-2320-runtime-template-compiler/requirements.md`
- `.docs/workflows/20260521-2320-runtime-template-compiler/spec.md`
- `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
- `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
