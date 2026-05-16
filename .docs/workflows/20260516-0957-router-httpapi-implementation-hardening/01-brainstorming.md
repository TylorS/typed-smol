## Problem Statement

The Router and HttpApi virtual-module plugins in `@typed/app` need implementation hardening. The corrected objective is not to harden the tests as an end in itself; tests should prove implementation behavior. The selected direction is a full production pass across both plugins, with heavy emphasis on generated-source correctness.

## Desired Outcomes

- Router generated source is deterministic, type-checking, and semantically aligned with matcher behavior.
- HttpApi generated source is deterministic, type-checking, and semantically aligned with the installed Effect HttpApi APIs.
- Invalid inputs fail clearly through structured diagnostics rather than host crashes, silent convention loss, or warnings that allow broken generated source.
- The final PR contains implementation changes with targeted regression proof and updated workflow artifacts.

## Constraints and Assumptions

- Mode is `strict`; finalization strategy is `pr`.
- Follow stage order: brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization.
- Phase 1 requires `intent.md` and `scope.md`; do not commit or continue until the human explicitly approves them.
- Existing durable specs are source grounding, but research may identify stale contracts that need updates.
- Effect-related claims must be grounded in local Effect skill ownership and installed dependency behavior.
- Subagent routing is required by repo policy for specialist work, but Codex subagent spawning is only available when the human explicitly asks for subagents; this workflow is proceeding directly unless that changes.

## Known Unknowns and Risks

- The current HttpApi emitter may not fully use the existing descriptor tree/convention metadata despite the durable spec requiring AST-normalized emission.
- Unsupported HttpApi reserved-looking files currently appear warning-capable; research must decide whether they should participate, diagnose, or be ignored.
- OpenAPI config normalization can discard diagnostics in the current build path if not surfaced.
- Router renderer contains internal invariant `throw` paths; research must determine which are unreachable after validation and which should become structured diagnostics.
- Generated-source type-checking may need a stronger fixture harness to prove Effect HttpApi API compatibility.

## Candidate Approaches

### Approach A: Fail-Closed Correctness First

Focus first on turning invalid plugin inputs and internal renderer invariants into structured diagnostics.

Pros:
- Reduces host-crash risk quickly.
- Gives clear failure behavior for editor/compiler workflows.

Cons:
- Can still leave generated TypeScript semantically wrong if the renderer itself has stale assumptions.

### Approach B: Generated-Source Correctness First

Focus first on emitted source: type-check fixtures, deterministic snapshots, Router matcher semantics, HttpApi assembly, handler wiring, prefixes, OpenAPI routes, and imports.

Pros:
- Directly targets the most user-visible risk.
- Proves framework behavior from the generated artifact, not only internal helpers.

Cons:
- Some invalid-input handling may remain weak until the second hardening pass.

### Approach C: Full Production Pass With Generated-Source Bias

Research both correctness lanes, then plan small red-green slices that prioritize generated-source correctness while pulling in fail-closed diagnostics where needed.

Pros:
- Matches the user's selected scope.
- Avoids optimizing tests around a stale implementation contract.
- Keeps Router and HttpApi production readiness in one coherent tranche.

Cons:
- Requires a heavier research and requirements phase before implementation.

## Recommendation

Use Approach C. The work should be a full production pass, but generated-source correctness should be the primary acceptance axis. Fail-closed diagnostics should be treated as supporting hardening, especially where invalid input currently leads to crashes, stale source, or warnings that should block.

## Source Grounding

- consulted_specs:
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/router-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
- consulted_adrs:
  - none found relevant during Phase 1 bootstrapping.
- consulted_workflows:
  - `.docs/workflows/20260515-2018-typed-framework-evolution/intent.md`
  - `.docs/workflows/20260515-2018-typed-framework-evolution/scope.md`
  - `.docs/workflows/20260515-2018-typed-framework-evolution/requirements.md`
- consulted_code:
  - `packages/app/AGENTS.md`
  - `packages/app/src/RouterVirtualModulePlugin.ts`
  - `packages/app/src/HttpApiVirtualModulePlugin.ts`
  - `packages/app/src/internal/buildRouteDescriptors.ts`
  - `packages/app/src/internal/routerDescriptorTree.ts`
  - `packages/app/src/internal/emitRouterSource.ts`
  - `packages/app/src/internal/httpapiDescriptorTree.ts`
  - `packages/app/src/internal/httpapiFileRoles.ts`
  - `packages/app/src/internal/emitHttpApiSource.ts`
  - `packages/app/src/RouterVirtualModulePlugin.test.ts`
  - `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- verification_snapshot:
  - `pnpm --filter @typed/app test`
  - result: 9 test files passed, 205 tests passed, no type errors.

## Initial Memory Strategy

- Capture short-term execution notes under `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/memory/`.
- Promote durable learnings only if they affect future Router/HttpApi plugin work, generated-source proof strategy, or Effect HttpApi compatibility assumptions.
