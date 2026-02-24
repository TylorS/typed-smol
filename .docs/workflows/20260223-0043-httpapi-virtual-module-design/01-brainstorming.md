## Problem Statement

Design a companion virtual-module plugin to `RouterVirtualModulePlugin` that resolves `api:./<directory>` imports and generates `HttpApi`-based API assembly code from filesystem conventions, while preserving synchronous behavior, deterministic output, and strict structural type-checking through `TypeInfoApi`.

## Desired Outcomes

- A clear plugin contract (`shouldResolve` + `build`) parallel to router behavior.
- Filesystem conventions that map cleanly to `HttpApi`, `HttpApiGroup`, and endpoint composition.
- Deterministic source generation with stable ordering and typed diagnostics.
- Structural type checks via `TypeInfoApi` (`assignableTo`) instead of string-based type parsing.
- A generated surface that supports both API definition assembly and handler-layer wiring (`HttpApiBuilder`).

## Constraints and Assumptions

- Must remain synchronous under `@typed/virtual-modules` core contract.
- Must reuse `TypeInfoApi.file()` / `directory()` query model and dependency watch descriptors.
- Must fit first-match plugin-manager behavior used by current Vite integration.
- Must align with existing docs architecture (durable behavior in `.docs/specs`, decisions in `.docs/adrs`).
- Assumes no direct in-repo production example of `effect/unstable/httpapi`; design should isolate unstable API usage behind generated adapters.

## Known Unknowns and Risks

- No existing in-repo runtime integration for `HttpApiBuilder.group()` + generated conventions.
- Unclear optimal balance between explicit exports and convention-derived defaults for endpoints/security/middleware.
- Risk of over-copying router conventions where HttpApi semantics differ (especially group and security composition).
- Potential ambiguity in mapping directory hierarchy to group identifiers and endpoint path segments.

## Candidate Approaches

### 1) Endpoint-Centric Convention (filesystem drives everything)

- Every non-companion script file is an endpoint leaf.
- Directories imply group hierarchy.
- Required exports per leaf: `endpoint` and exactly one handler entrypoint (`handler`, plus optional method-specific overrides).
- Pros:
  - maximal convention, minimal boilerplate.
  - aligns with router discovery model.
- Cons:
  - harder to represent group-level metadata/security explicitly.
  - high risk of ambiguous inferred behavior.

### 2) Group-First Convention (explicit group modules + endpoint leaves)

- Group root files explicitly export a group contract.
- Endpoint leaves attach to nearest explicit group.
- Directory companions provide shared concerns (security/middleware/errors) similar to router hierarchy.
- Pros:
  - explicit architecture at group boundaries.
  - better place for group-level auth/security policies.
- Cons:
  - more files/exports required.
  - slightly steeper learning curve.

### 3) Hybrid Convention with Optional Manifest (recommended)

- Default to convention (endpoint leaves + directory hierarchy), but allow optional `_api.ts` / `_group.ts` files to override identifiers and attach metadata.
- Preserve deterministic fallback behavior when override files are absent.
- Generated module exports:
  - assembled `api` value,
  - typed handler-layer factory wiring for `HttpApiBuilder`.
- Pros:
  - keeps simple cases low-ceremony.
  - supports advanced cases without abandoning conventions.
  - closest fit to router plugin ergonomics and strict diagnostics.
- Cons:
  - more design surface to specify and test.

## Recommendation

Adopt **Approach 3 (Hybrid Convention with Optional Manifest)**:

1. Use `api:` prefix with router-like directory resolution semantics.
2. Discover candidate API files from regular script extensions (`.ts/.tsx/.js/...`) and exclude companion-only patterns.
3. Require structural compatibility checks through `TypeInfoApi.assignableTo` for all core contracts (`HttpApi`, `HttpApiGroup`, endpoint shapes, handler wiring inputs).
4. Define companion conventions for group-level concerns (security/middleware/errors/tags) with deterministic ancestor-to-leaf composition order.
5. Generate a stable module that exports both API assembly and builder integration helpers.

## Source Grounding

- consulted_specs:
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/router-virtual-module-plugin/requirements.md`
- consulted_adrs:
  - `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
  - `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`
- consulted_workflows:
  - `.docs/workflows/20260221-1705-router-virtual-module-brainstorm/01-brainstorming.md`
  - `.docs/workflows/20260221-1705-router-virtual-module-brainstorm/02-research.md`
  - `.docs/workflows/20260221-1815-router-virtual-module-execution-plan/01-plan.md`

## Initial Memory Strategy

- short_term_capture:
  - Track convention trade-offs and unresolved composition rules in this workflow folder under `memory/`.
  - Capture provisional naming decisions and rejected alternatives with rationale.
- promotion_policy:
  - Promote only after specification hardens FR/NFR/AC and design is validated by at least one implementation test fixture.
