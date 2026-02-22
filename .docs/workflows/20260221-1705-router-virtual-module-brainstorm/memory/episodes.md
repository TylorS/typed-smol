## Episode: 2026-02-21 self-improvement loop (scope + requirements)

- objective:
  - Scope and draft requirements for the router filesystem virtual-module plugin with clear traceability.

- routing_decision:
  - selected: specialist subagent (`requirements-analyst`)
  - why: mandatory trigger matched (`requirements/spec extraction`) per `.cursor/rules/agent-collaboration.mdc`.

- observe:
  - Friction in prior step: naming and composition ideas were strong, but requirement traceability and ambiguity handling were not formalized.

- diagnose:
  - Root cause: brainstorming output did not yet encode testable FR/NFR/AC mappings or explicit unresolved policy.

- propose:
  - P1: Use specialist subagent to extract FR/NFR/AC skeleton from brainstorm + code evidence.
  - P2: Add a deterministic composition policy section directly into requirements.
  - P3: Add explicit unresolved/diagnostic requirements to reduce integration risk.

- validate (highest impact: P1):
  - Applied: subagent produced scoped requirement structure and open questions.
  - Test: integrated draft into `.docs/specs/router-virtual-module-plugin/requirements.md` with traceable AC mappings.
  - Result: improved completeness and reduced ambiguity for planning/spec stages.

- consolidate:
  - Keep: specialist-first routing for requirements-heavy stages.
  - Keep: explicit one-of export contract + deterministic ordering requirements.
  - Discard: delaying unresolved-policy definition until implementation.

- apply_next:
  - Carry forward requirement IDs and AC mappings directly into next specification/planning artifacts.
  - Keep TypeInfoApi-first validation in scope definitions to avoid filename-convention drift.

- user_feedback_applied:
  - Removed `*.route.ts` assumption.
  - Switched to regular `*.ts` candidate discovery with TypeInfoApi contract validation.
  - Added generation-time plain-value lifting requirement.
  - requirements approval gate result: `LGTM`.

## Episode: 2026-02-21 specification drafting

- objective:
  - Produce canonical `spec.md` with diagrams, traceability, and embedded testing strategy.

- routing_decision:
  - selected: specialist subagent (`specification-writer`)
  - why: mandatory trigger matched (`requirements/spec extraction` specialist concern).

- observe:
  - Main risk was mismatch between requirements policy (`unresolved` vs `structured invalid`) and plugin contract boundaries.

- diagnose:
  - Root cause: requirements language allows both outcomes but implementation boundaries differ by phase (`shouldResolve` vs `build`).

- propose:
  - P1: Specify phase-bound policy in spec sequence diagram and failure table.
  - P2: Add dedicated ADR for durable discovery/composition contract to avoid future drift.

- validate (highest impact: P2):
  - Added ADR `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`.
  - Cross-linked ADR from spec.
  - Spec approval gate result: `LGTM`.

- consolidate:
  - Keep: phase-bound failure policy in specs whenever unresolved/error outcomes can both occur.
  - Keep: specialist subagent routing for specification-heavy stages.
