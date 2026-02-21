## Property-Based Testing: Effect/FastCheck First

- **Rule:** When writing tests, prefer `effect/testing/FastCheck` for property-based testing wherever possible instead of brittle hand-written examples.
- **Scope:** Type guards, validators, pure functions, invariants, round-trip properties.
- **Why:** Broader coverage, fewer brittle edge-case specs, automatic shrinking to minimal counterexamples, easier extension.
- **How:**
  - Use `FastCheck.property(arbitrary, predicate)` + `FastCheck.assert(property)` inside vitest `it()`.
  - Prefer built-in arbitraries: `uuid({ version: 4|5|7 })`, `ulid()`, `stringMatching(regex)`.
  - For "rejects invalid" tests: use `FastCheck.oneof(constant(""), string().filter(...))` or pattern-mismatch filters.
- **Enforcement:** Apply during test writing in Execution Stage and when adding/modifying type guards or validators.
- **Source evidence:** `packages/id/src/Id.test.ts` refactor (2025-02-21); `.cursor/skills/effect-facet-testing-fastcheck/`.
