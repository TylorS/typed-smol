# Scope

## In Scope

- Review the existing `@typed/compiler` implementation and identify what is necessary versus speculative.
- Simplify current compiler internals around:
  - template analysis and `TemplatePlan` shape;
  - DOM/server template emission boundaries;
  - compile capability planning;
  - HMR analysis for route components and participating dependencies;
  - `RefSubject` HMR state planning.
- Sequence the first implementation bits around compiler simplifications that unblock HMR improvements, without splitting HMR onto a separate ad hoc path.
- Preserve the requirement that all `@typed/template` `html` templates are optimization targets across server, DOM, and future supported environments.
- Preserve the distinction between:
  - general optimized template compilation for all `html` templates;
  - state-preserving HMR only for route components and participating dependencies with compiler-visible state boundaries.
- Continue toward Typed application compilation with HMR through `RefSubject`, especially service-backed or otherwise stable state identities.
- Favor property/equivalence tests where practical, especially for template IR and runtime equivalence.
- Keep changes compatible with the existing virtual-module-first architecture.

## Out Of Scope

- Replacing `@typed/virtual-modules-compiler` or `vmc`.
- Adding filesystem routing.
- Rewriting all of `@typed/template` rendering before a narrowed compiler contract is approved.
- Preserving arbitrary closure-local state across HMR.
- Adding production-only HMR behavior.
- Broad arbitrary TypeScript optimization outside Typed template/app compiler surfaces.

## Current Assumptions

- `TemplatePlan` is still useful, but it may need to become smaller and more target-neutral in a way that also carries the metadata HMR needs.
- The current DOM/server emitters should probably become clearer target adapters over shared compiler data instead of two mostly separate runtime renderers.
- HMR source analysis should move away from fragile regular expressions early because that is enabling work for trustworthy `RefSubject` HMR.
- `RefSubject.Service` or an equivalent stable identity model remains the right direction for HMR state preservation.
- Existing workflow `20260521-2320-runtime-template-compiler` is reference context only; this run owns its own docs and decisions.

## Acceptance Shape For Phase 1

Phase 1 is complete only when the human explicitly approves `intent.md` and `scope.md`.

After approval, commit these phase-1 documents and continue to the strict-mode research stage.
