## Problem Statement

Pick a clear package name for the "framework" surface of Typed, and design a filesystem-driven `router:./directory` virtual-module plugin that maps route files onto `@typed/router` `Matcher.match` behavior (including optional `guard`, `dependencies`, `layout`, and `catch` composition).

## Desired Outcomes

- A package name that reads clearly next to existing packages like `@typed/router`, `@typed/ui`, and `@typed/navigation`.
- A deterministic filesystem convention for route modules and optional companion modules.
- Hierarchical semantics that mirror `Matcher` composition (prefixes + layered layouts/catches/dependencies + guards).
- Type-safe exports where route definitions and dependency lists can be authored with `as const` where useful.

## Constraints and Assumptions

- Keep virtual-module plugin behavior synchronous (aligned with `@typed/virtual-modules` requirements/ADR).
- Route module contract:
  - required: `route`
  - required one-of: `handler | template | default`
  - optional: `guard`, `dependencies`, `layout`, `catch`
- Support similarly named optional files for hierarchical composition.
- Preserve deterministic ordering and path normalization across platforms.

## Known Unknowns and Risks

- Composition policy ambiguity:
  - Should ancestor and leaf guards be AND-composed, or should leaf override?
  - Should catches/layouts compose (stack), or leaf override ancestor?
- Route identity ambiguity:
  - Should filesystem path always imply route path, or must `route` export be authoritative?
- Developer ergonomics risk:
  - Too many naming variants can make routing hard to reason about.

## Candidate Approaches

### 1) Single-file route modules only

- Shape: one file exports `route` + one-of `handler|template|default` + optional fields inline.
- Pros:
  - simple mental model.
  - strongest local type inference.
- Cons:
  - weak hierarchy story.
  - optional concerns become repetitive across siblings.

### 2) Sibling companion files (recommended core)

- Leaf file owns the required route payload:
  - `users.route.ts` exports `{ route, handler|template|default }`.
- Optional concerns can be colocated via basename siblings:
  - `users.guard.ts`
  - `users.dependencies.ts`
  - `users.layout.ts`
  - `users.catch.ts`
- Directory-wide concerns use underscored files:
  - `_guard.ts`, `_dependencies.ts`, `_layout.ts`, `_catch.ts`
- Pros:
  - mirrors filesystem hierarchy and keeps concerns split.
  - predictable naming.
  - easy static discovery by plugin.
- Cons:
  - more files.
  - requires explicit composition rules.

### 3) Convention-over-configuration with implicit route-from-path

- Route files omit `route` and derive path from filename/folder.
- Pros:
  - fewer exports.
- Cons:
  - conflicts with requested required `route` export.
  - weaker explicitness and type intent.

## Recommendation

Adopt approach 2 with explicit, deterministic composition:

1. **Framework package naming**
   - Primary recommendation: `@typed/app`
   - Why:
     - Reads naturally as the integration surface for router + ui + navigation.
     - Avoids overloading `@typed/core` (too generic) and `@typed/web` (too transport-specific).
   - Alternate candidates:
     - `@typed/platform` (if the package will hold cross-runtime adapters too)
     - `@typed/framework` (explicit but verbose)

2. **Route file convention**
   - Leaf route modules:
     - `*.route.ts` exporting the required route contract.
   - Sibling optional files (same basename):
     - `*.guard.ts`, `*.dependencies.ts`, `*.layout.ts`, `*.catch.ts`
   - Directory optionals (hierarchical):
     - `_guard.ts`, `_dependencies.ts`, `_layout.ts`, `_catch.ts`

3. **Composition rules**
   - `route`: always from the leaf `*.route.ts` module.
   - `guard`: AND-compose ancestor -> leaf (first `none`/failure prevents match).
   - `dependencies`: concatenate ancestor -> leaf as one readonly tuple/list.
   - `layout`: compose ancestor outermost, leaf innermost.
   - `catch`: compose ancestor outermost, leaf innermost.
   - `handler|template|default`: exactly one chosen by precedence:
     - `handler` first, else `template`, else `default`.

4. **Type-safety and `as const` guidance**
   - Prefer readonly literals for plugin metadata and dependency arrays:
     - `export const dependencies = [FooLayer, BarLayer] as const`
   - Generate normalized route descriptors as readonly:
     - `const routes = [...] as const`
   - Use discriminated unions for module contract validation so plugin errors are compile-time friendly where possible.

## Source Grounding

- consulted_specs:
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/virtual-modules/requirements.md`
- consulted_adrs:
  - `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
- consulted_workflows:
  - `.docs/workflows/20260220-2209-virtual-modules/01-brainstorming.md`
  - `.docs/workflows/20260220-2209-virtual-modules/02-research.md`
  - `.docs/workflows/20260221-1600-virtual-modules-vscode/00-plan.md`
- code grounding:
  - `packages/router/src/Matcher.ts`
  - `packages/router/src/AST.ts`
  - `packages/router/src/Route.ts`

## Initial Memory Strategy

- Short-term capture:
  - Keep this naming + filesystem convention in this workflow folder until implementation validates ergonomics.
- Promotion policy:
  - Promote only after implementation confirms composition rules and file naming hold up in tests.
