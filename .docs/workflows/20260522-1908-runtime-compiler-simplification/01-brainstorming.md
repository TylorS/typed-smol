## Problem Statement

`@typed/compiler` has a useful starting point, but its implementation is rough: template analysis, target emission, capability planning, and HMR planning exist as parallel layers without a sufficiently small central model. The next tranche should simplify the compiler around what is now known to be necessary, with the first bits deliberately enabling HMR improvements while still serving all-template optimization.

## Desired Outcomes

- A smaller compiler architecture with fewer speculative layers.
- A clear central contract for optimizing all `html` templates across environments.
- A clear, narrower contract for stateful HMR through `RefSubject`.
- Early simplifications that make `RefSubject` HMR safer and easier to implement.
- A staged path where simplification improves implementation velocity instead of becoming a standalone cleanup.
- Tests that prove behavior is preserved while code is simplified.

## Constraints and Assumptions

- Strict-mode stage order is required.
- Finalization strategy is merge.
- This run must use a fresh workflow folder unless explicitly told to reuse an old one.
- `@typed/compiler` does not replace `@typed/virtual-modules-compiler`.
- Virtual-module-first architecture remains a hard constraint.
- All `html` templates are optimization targets.
- Stateful HMR is narrower than template optimization.
- Existing rough compiler code should be researched before any implementation.

## Known Unknowns and Risks

- Which current compiler abstractions are accidental versus worth keeping.
- Whether `TemplatePlan` should remain the main IR or be split into parsed shape plus target instructions.
- Whether current DOM/server emitters should remain executable renderers, become source emitters, or become test/reference adapters.
- How soon HMR analysis should move from regex scanning to TypeScript/compiler-driven analysis.
- Whether closure-context planning belongs in this simplification tranche or should stay deferred.

## Candidate Approaches

### Approach A: Shared Compiler Substrate, HMR-Enabling First

Simplify `TemplatePlan`, target emitters, and HMR descriptors around one shared compiler model. Sequence the first implementation tasks toward HMR-enabling changes, such as replacing fragile source scanning and making stable `RefSubject` identity explicit, while keeping all `html` templates on the same optimization path.

Pros:
- Directly supports all-`html` optimization.
- Makes server/DOM equivalence tests easier.
- Reduces broad compiler complexity while immediately unblocking HMR improvements.
- Avoids a separate HMR-only compiler path.

Cons:
- Requires careful sequencing so template and HMR work do not blur together.
- Needs stronger tests around both template equivalence and HMR eligibility.

### Approach B: HMR-First Simplification

Focus only on `RefSubject` HMR boundaries, replacing regex planning and rough HMR descriptors with a cleaner typed/source-analysis model before touching template optimization.

Pros:
- Directly advances Typed application HMR.
- Attacks the riskiest rough code first.

Cons:
- Risks building HMR on top of an unsettled template compiler model.
- Splits HMR from the all-template optimization compiler path.

### Approach C: Capability-Layer Simplification

Keep existing template/HMR modules mostly intact, but simplify `compileCapabilities` into the central orchestration layer and let it drive subsequent cleanup.

Pros:
- Could preserve the most current code.
- Gives one entrypoint for staged compiler behavior.

Cons:
- Risks cementing existing rough module boundaries.
- May not remove enough complexity.

## Recommendation

Start with Approach A. The user explicitly wants both all-template optimization and HMR progress, with the first bits enabling HMR improvements. That means the plan should simplify the shared compiler substrate and choose early tasks that unblock trustworthy `RefSubject` HMR, rather than treating HMR as a later or separate track.

## Source Grounding

- consulted_specs:
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/typed-framework-starter/spec.md`
- consulted_adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
- consulted_workflows:
  - `.docs/workflows/20260521-2320-runtime-template-compiler/`

## Initial Memory Strategy

- Capture workflow-local lessons in `memories.md` during execution.
- Promote only durable compiler/HMR heuristics to `.docs/_meta/memory/` during finalization.
