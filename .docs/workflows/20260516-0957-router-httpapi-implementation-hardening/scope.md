# Scope — Router and HttpApi Implementation Hardening

Status: draft, not approved.

## In Scope

### Router Virtual Module Implementation

- Audit and harden route descriptor construction and generated Router matcher source.
- Verify and harden route ordering, import generation, path normalization, and stable output.
- Verify and harden `handler` / `template` / `default` normalization across `Fx`, `Effect`, `Stream`, and plain values.
- Verify and harden companion composition for guard, dependencies, layout, and catch concerns.
- Replace implementation paths that can host-crash on invalid plugin inputs with structured build diagnostics where practical.
- Add or update tests that prove emitted source and behavior for high-risk Router scenarios.

### HttpApi Virtual Module Implementation

- Audit and harden the filesystem role classifier, descriptor tree, convention resolver, and source emitter.
- Verify and harden generated Effect HttpApi assembly for API, group, endpoint, client, layer, app, serve, Swagger, Scalar, and OpenAPI exports.
- Verify and harden endpoint contract validation, raw-vs-normal handler selection, optional schema exports, path prefixes, group/pathless-directory mapping, and deterministic naming.
- Verify and harden convention precedence: in-file > sibling companion > directory companion, ancestor-to-leaf where composition applies.
- Decide whether unsupported reserved roles and invalid OpenAPI config should be hard build errors in this tranche, and implement the approved behavior.
- Add or update tests that prove emitted source type-checks and remains deterministic for high-risk HttpApi scenarios.

### Generated-Source Proof

- Prefer emitted-source type-check fixtures and behavior-focused tests over assertion-only coverage additions.
- Include negative fixtures for invalid source trees and stale contract assumptions.
- Reuse existing package-level test and build commands as the baseline verification gates.
- Add focused regression tests around any implementation hardening patch before changing the implementation.

### Documentation and Traceability

- Keep this workflow under `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/`.
- Use existing durable specs as source grounding:
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/router-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
  - `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
- Update durable specs only when research proves the intended steady-state contract has changed.
- Maintain requirement traceability from requirements to plan to execution.

## Out of Scope

- New first-party app plugins such as env/config virtual modules.
- Create-app template work.
- Publishing packages.
- Full adapter ecosystem design.
- Replacing the shared virtual artifact store contract from the previous tranche.
- Broad runtime server feature work beyond what generated HttpApi source must emit correctly.
- Large refactors unrelated to making Router and HttpApi virtual-module implementation behavior correct and auditable.

## Likely Workstreams

1. Research current Router and HttpApi implementation behavior against durable specs and installed dependency APIs.
2. Define hardening requirements with generated-source correctness as the primary acceptance axis.
3. Specify the exact parse/normalize/validate/render boundaries and diagnostic behavior.
4. Plan tasks in small red-green slices with fixture/type-check proof.
5. Execute Router hardening tasks.
6. Execute HttpApi hardening tasks.
7. Finalize with package verification, branch commit, push, and PR.

## Sequencing Bias

- Start by researching generated source and current Effect HttpApi API compatibility.
- Prioritize failure modes that can emit wrong TypeScript or wrong runtime wiring over cosmetic output churn.
- Then harden fail-closed diagnostics for invalid inputs discovered during that research.
- Keep Router and HttpApi work separated enough that failures can be traced to one plugin surface at a time.

## Phase 1 Deliverables

- Approved `intent.md`.
- Approved `scope.md`.
- Initial `01-brainstorming.md` capturing source grounding, candidate approaches, and recommended direction.
- Explicit list of high-priority unknowns to carry into research.

## Approval Rule

These documents are drafts until the human explicitly approves them. After approval, commit the Phase 1 artifacts and continue to Phase 2.
