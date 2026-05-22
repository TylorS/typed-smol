# @typed/compiler

## Intent

`@typed/compiler` is the focused template/app compiler package for typed-smol. It owns template IR, server and DOM template emitters, route-component HMR analysis, dependency participation analysis, and closure-context rewrite planning.

## Constraints

- It integrates with `@typed/virtual-modules-compiler`; it does not replace `vmc`.
- It optimizes all `@typed/template` `html` templates.
- Stateful HMR is limited to route components and participating dependencies with stable service/context identity.
- Preserve `Effect`, `Fx`, and `Renderable` success/error/service typing.
- Prefer property and equivalence tests over shallow unit tests.

## Pointers

- Workflow: `.docs/workflows/20260521-2320-runtime-template-compiler/`
- ADR: `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`
- Siblings: `@typed/template`, `@typed/app`, `@typed/fx`, `@typed/virtual-modules`
